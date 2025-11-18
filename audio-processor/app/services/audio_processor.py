"""
Audio Processing Service
Handles audio normalization, enhancement, and metadata management
"""

import os
import logging
import hashlib
from pathlib import Path
from typing import Dict, Optional, Tuple
from pydub import AudioSegment
from pydub.effects import normalize, compress_dynamic_range
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, TIT2, TPE1, TALB, APIC, TDRC
from mutagen.easyid3 import EasyID3
from PIL import Image
import requests
from io import BytesIO
from ..config import settings

logger = logging.getLogger(__name__)


class AudioProcessor:
    """Audio processing and enhancement"""

    def __init__(self):
        """Initialize audio processor"""
        self.processed_dir = settings.DOWNLOAD_DIR / "processed"
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    def process_audio(
        self,
        input_file: str,
        output_file: Optional[str] = None,
        normalize_audio: bool = True,
        target_format: str = "mp3",
        target_bitrate: int = 320
    ) -> Dict:
        """
        Process audio file - normalize, convert, enhance

        Args:
            input_file: Path to input audio file
            output_file: Path to output file (optional)
            normalize_audio: Apply normalization
            target_format: Target audio format
            target_bitrate: Target bitrate in kbps

        Returns:
            Dictionary with processing results

        Raises:
            Exception: If processing fails
        """
        try:
            input_path = Path(input_file)

            if not input_path.exists():
                raise FileNotFoundError(f"Input file not found: {input_file}")

            # Generate output filename if not provided
            if not output_file:
                output_file = str(self.processed_dir / f"{input_path.stem}_processed.{target_format}")

            logger.info(f"Processing audio: {input_file}")

            # Load audio file
            audio = AudioSegment.from_file(str(input_file))

            # Store original properties
            original_duration = len(audio) / 1000.0  # Convert to seconds
            original_channels = audio.channels
            original_sample_rate = audio.frame_rate

            # Apply normalization if requested
            if normalize_audio and settings.NORMALIZE_AUDIO:
                logger.info("Applying audio normalization")
                audio = normalize(audio)

            # Apply dynamic range compression (subtle enhancement)
            audio = compress_dynamic_range(audio, threshold=-20.0, ratio=4.0)

            # Convert to mono if stereo and too large (optional optimization)
            # Uncomment if needed:
            # if audio.channels > 1:
            #     audio = audio.set_channels(1)

            # Set sample rate
            if audio.frame_rate != settings.AUDIO_SAMPLE_RATE:
                audio = audio.set_frame_rate(settings.AUDIO_SAMPLE_RATE)

            # Export with specified bitrate
            audio.export(
                output_file,
                format=target_format,
                bitrate=f"{target_bitrate}k",
                parameters=["-q:a", "0"]  # Highest quality
            )

            # Get output file info
            output_path = Path(output_file)
            file_size = output_path.stat().st_size

            logger.info(f"Audio processing completed: {output_file}")

            return {
                'success': True,
                'output_file': str(output_file),
                'file_size': file_size,
                'duration': original_duration,
                'original_sample_rate': original_sample_rate,
                'output_sample_rate': settings.AUDIO_SAMPLE_RATE,
                'original_channels': original_channels,
                'bitrate': target_bitrate,
                'format': target_format,
                'normalized': normalize_audio
            }

        except Exception as e:
            logger.error(f"Error processing audio {input_file}: {e}")
            raise

    def extract_metadata(self, audio_file: str) -> Dict:
        """
        Extract metadata from audio file

        Args:
            audio_file: Path to audio file

        Returns:
            Dictionary with metadata
        """
        try:
            audio = MP3(audio_file)

            metadata = {
                'duration': audio.info.length if hasattr(audio, 'info') else 0,
                'bitrate': audio.info.bitrate if hasattr(audio, 'info') else 0,
                'sample_rate': audio.info.sample_rate if hasattr(audio, 'info') else 0,
                'channels': audio.info.channels if hasattr(audio, 'info') else 0,
                'title': None,
                'artist': None,
                'album': None,
                'year': None,
                'has_artwork': False
            }

            # Extract ID3 tags
            try:
                tags = EasyID3(audio_file)
                metadata['title'] = tags.get('title', [None])[0]
                metadata['artist'] = tags.get('artist', [None])[0]
                metadata['album'] = tags.get('album', [None])[0]
                metadata['year'] = tags.get('date', [None])[0]
            except:
                pass

            # Check for album artwork
            try:
                tags = ID3(audio_file)
                for tag in tags.values():
                    if isinstance(tag, APIC):
                        metadata['has_artwork'] = True
                        break
            except:
                pass

            return metadata

        except Exception as e:
            logger.error(f"Error extracting metadata from {audio_file}: {e}")
            return {}

    def embed_metadata(
        self,
        audio_file: str,
        title: Optional[str] = None,
        artist: Optional[str] = None,
        album: Optional[str] = None,
        year: Optional[str] = None,
        artwork_url: Optional[str] = None,
        artwork_file: Optional[str] = None
    ) -> bool:
        """
        Embed metadata into audio file

        Args:
            audio_file: Path to audio file
            title: Track title
            artist: Artist name
            album: Album name
            year: Release year
            artwork_url: URL to download artwork from
            artwork_file: Path to artwork file

        Returns:
            True if successful, False otherwise
        """
        try:
            # Load or create ID3 tags
            try:
                tags = ID3(audio_file)
            except:
                tags = ID3()

            # Set text frames
            if title:
                tags["TIT2"] = TIT2(encoding=3, text=title)

            if artist:
                tags["TPE1"] = TPE1(encoding=3, text=artist)

            if album:
                tags["TALB"] = TALB(encoding=3, text=album)

            if year:
                tags["TDRC"] = TDRC(encoding=3, text=year)

            # Add album artwork
            if artwork_url or artwork_file:
                artwork_data = None

                if artwork_url:
                    # Download artwork
                    artwork_data = self._download_artwork(artwork_url)
                elif artwork_file and Path(artwork_file).exists():
                    # Read from file
                    with open(artwork_file, 'rb') as f:
                        artwork_data = f.read()

                if artwork_data:
                    # Add artwork to tags
                    tags["APIC"] = APIC(
                        encoding=3,
                        mime='image/jpeg',
                        type=3,  # Cover (front)
                        desc='Cover',
                        data=artwork_data
                    )

            # Save tags
            tags.save(audio_file)

            logger.info(f"Metadata embedded successfully: {audio_file}")
            return True

        except Exception as e:
            logger.error(f"Error embedding metadata in {audio_file}: {e}")
            return False

    def _download_artwork(self, url: str, max_size: Tuple[int, int] = (1200, 1200)) -> Optional[bytes]:
        """
        Download and resize artwork from URL

        Args:
            url: Artwork URL
            max_size: Maximum dimensions (width, height)

        Returns:
            Image data as bytes
        """
        try:
            # Download image
            response = requests.get(url, timeout=30)
            response.raise_for_status()

            # Open image
            image = Image.open(BytesIO(response.content))

            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background

            # Resize if too large
            if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
                image.thumbnail(max_size, Image.Resampling.LANCZOS)

            # Save to bytes
            buffer = BytesIO()
            image.save(buffer, format='JPEG', quality=90)
            return buffer.getvalue()

        except Exception as e:
            logger.error(f"Error downloading artwork from {url}: {e}")
            return None

    def calculate_file_hash(self, file_path: str) -> str:
        """
        Calculate MD5 hash of file for duplicate detection

        Args:
            file_path: Path to file

        Returns:
            MD5 hash string
        """
        try:
            hash_md5 = hashlib.md5()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except Exception as e:
            logger.error(f"Error calculating hash for {file_path}: {e}")
            return ""

    def validate_audio_quality(self, audio_file: str) -> Dict:
        """
        Validate audio quality meets requirements

        Args:
            audio_file: Path to audio file

        Returns:
            Dictionary with validation results
        """
        try:
            metadata = self.extract_metadata(audio_file)

            validation = {
                'is_valid': True,
                'issues': [],
                'bitrate_ok': True,
                'sample_rate_ok': True,
                'duration_ok': True
            }

            # Check bitrate
            if metadata.get('bitrate', 0) < settings.AUDIO_BITRATE * 1000:
                validation['is_valid'] = False
                validation['bitrate_ok'] = False
                validation['issues'].append(
                    f"Bitrate too low: {metadata.get('bitrate', 0) // 1000}kbps "
                    f"(expected {settings.AUDIO_BITRATE}kbps)"
                )

            # Check sample rate
            if metadata.get('sample_rate', 0) < settings.AUDIO_SAMPLE_RATE:
                validation['is_valid'] = False
                validation['sample_rate_ok'] = False
                validation['issues'].append(
                    f"Sample rate too low: {metadata.get('sample_rate', 0)}Hz "
                    f"(expected {settings.AUDIO_SAMPLE_RATE}Hz)"
                )

            # Check duration (minimum 1 second)
            if metadata.get('duration', 0) < 1:
                validation['is_valid'] = False
                validation['duration_ok'] = False
                validation['issues'].append("Audio file too short")

            return validation

        except Exception as e:
            logger.error(f"Error validating audio quality for {audio_file}: {e}")
            return {
                'is_valid': False,
                'issues': [str(e)],
                'bitrate_ok': False,
                'sample_rate_ok': False,
                'duration_ok': False
            }

    def convert_format(
        self,
        input_file: str,
        output_format: str = "mp3",
        bitrate: int = 320
    ) -> str:
        """
        Convert audio file to different format

        Args:
            input_file: Path to input file
            output_format: Target format
            bitrate: Target bitrate in kbps

        Returns:
            Path to converted file
        """
        try:
            input_path = Path(input_file)
            output_file = str(input_path.parent / f"{input_path.stem}.{output_format}")

            audio = AudioSegment.from_file(input_file)
            audio.export(
                output_file,
                format=output_format,
                bitrate=f"{bitrate}k"
            )

            logger.info(f"Converted {input_file} to {output_format}")
            return output_file

        except Exception as e:
            logger.error(f"Error converting {input_file} to {output_format}: {e}")
            raise

    def get_audio_info(self, audio_file: str) -> Dict:
        """
        Get comprehensive audio file information

        Args:
            audio_file: Path to audio file

        Returns:
            Dictionary with all audio information
        """
        try:
            file_path = Path(audio_file)

            # Get file stats
            file_size = file_path.stat().st_size

            # Get metadata
            metadata = self.extract_metadata(audio_file)

            # Get file hash
            file_hash = self.calculate_file_hash(audio_file)

            # Validate quality
            quality = self.validate_audio_quality(audio_file)

            return {
                'file_path': str(audio_file),
                'file_name': file_path.name,
                'file_size': file_size,
                'file_size_mb': round(file_size / (1024 * 1024), 2),
                'file_hash': file_hash,
                'metadata': metadata,
                'quality': quality,
                'format': file_path.suffix.replace('.', '')
            }

        except Exception as e:
            logger.error(f"Error getting audio info for {audio_file}: {e}")
            raise
