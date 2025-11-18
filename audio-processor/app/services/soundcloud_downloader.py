"""
SoundCloud Downloader Service
Uses scdl for SoundCloud downloading
"""

import os
import logging
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Callable
import json
from ..config import settings

logger = logging.getLogger(__name__)


class SoundCloudDownloader:
    """SoundCloud audio downloader using scdl"""

    def __init__(self, progress_callback: Optional[Callable] = None):
        """
        Initialize SoundCloud downloader

        Args:
            progress_callback: Function to call with progress updates
        """
        self.progress_callback = progress_callback
        self.download_dir = settings.DOWNLOAD_DIR / "soundcloud"
        self.temp_dir = settings.TEMP_DIR

    def _get_scdl_command(self, url: str, output_dir: str, track_format: str = "mp3") -> List[str]:
        """
        Generate scdl command

        Args:
            url: SoundCloud URL
            output_dir: Output directory
            track_format: Audio format (default: mp3)

        Returns:
            Command list for subprocess
        """
        cmd = [
            "scdl",
            "-l", url,  # URL to download
            "--path", output_dir,  # Output directory
            "--onlymp3" if track_format == "mp3" else "--addtofile",  # Convert to MP3
            "--name-format", "{artist} - {title}",  # Filename format
            "--addtimestamp",  # Add timestamp to avoid duplicates
        ]

        # Add authentication if available
        if settings.SOUNDCLOUD_AUTH_TOKEN:
            cmd.extend(["--auth-token", settings.SOUNDCLOUD_AUTH_TOKEN])

        return cmd

    def extract_info(self, url: str) -> Dict:
        """
        Extract track/playlist information without downloading

        Args:
            url: SoundCloud URL

        Returns:
            Dictionary with track/playlist metadata

        Raises:
            Exception: If extraction fails
        """
        try:
            # Use scdl with --info flag to get metadata
            cmd = ["scdl", "-l", url, "--info"]

            if settings.SOUNDCLOUD_AUTH_TOKEN:
                cmd.extend(["--auth-token", settings.SOUNDCLOUD_AUTH_TOKEN])

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode != 0:
                raise Exception(f"scdl error: {result.stderr}")

            # Parse scdl output
            output = result.stdout.strip()

            # Determine if it's a track, playlist, or user
            if "tracks" in url or "/sets/" in url:
                return self._parse_playlist_info(output, url)
            else:
                return self._parse_track_info(output, url)

        except subprocess.TimeoutExpired:
            raise Exception("SoundCloud info extraction timed out")
        except Exception as e:
            logger.error(f"Error extracting SoundCloud info from {url}: {e}")
            raise

    def _parse_track_info(self, output: str, url: str) -> Dict:
        """Parse single track information from scdl output"""
        lines = output.split('\n')
        info = {
            'type': 'track',
            'url': url,
            'title': 'Unknown',
            'artist': 'Unknown',
            'duration': 0
        }

        for line in lines:
            if 'Title:' in line:
                info['title'] = line.split('Title:', 1)[1].strip()
            elif 'Artist:' in line or 'User:' in line:
                info['artist'] = line.split(':', 1)[1].strip()
            elif 'Duration:' in line:
                duration_str = line.split('Duration:', 1)[1].strip()
                info['duration'] = self._parse_duration(duration_str)

        return info

    def _parse_playlist_info(self, output: str, url: str) -> Dict:
        """Parse playlist information from scdl output"""
        lines = output.split('\n')
        info = {
            'type': 'playlist',
            'url': url,
            'title': 'Unknown Playlist',
            'artist': 'Unknown',
            'total_tracks': 0,
            'entries': []
        }

        for line in lines:
            if 'Playlist:' in line or 'Set:' in line:
                info['title'] = line.split(':', 1)[1].strip()
            elif 'User:' in line or 'Artist:' in line:
                info['artist'] = line.split(':', 1)[1].strip()
            elif 'tracks' in line.lower():
                # Try to extract number of tracks
                import re
                match = re.search(r'(\d+)\s+tracks?', line, re.IGNORECASE)
                if match:
                    info['total_tracks'] = int(match.group(1))

        return info

    def _parse_duration(self, duration_str: str) -> int:
        """
        Parse duration string to seconds

        Args:
            duration_str: Duration string (e.g., "3:45", "1:23:45")

        Returns:
            Duration in seconds
        """
        try:
            parts = duration_str.split(':')
            if len(parts) == 2:  # MM:SS
                return int(parts[0]) * 60 + int(parts[1])
            elif len(parts) == 3:  # HH:MM:SS
                return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
            else:
                return 0
        except:
            return 0

    def download_single(self, url: str, output_filename: Optional[str] = None) -> Dict:
        """
        Download a single SoundCloud track

        Args:
            url: SoundCloud track URL
            output_filename: Custom filename (without extension)

        Returns:
            Dictionary with download results

        Raises:
            Exception: If download fails
        """
        try:
            # Extract info first
            info = self.extract_info(url)

            # Create output directory
            output_dir = self.download_dir
            output_dir.mkdir(parents=True, exist_ok=True)

            # Build scdl command
            cmd = self._get_scdl_command(url, str(output_dir))

            # Execute download
            if self.progress_callback:
                self.progress_callback({
                    'status': 'downloading',
                    'title': info.get('title', 'Unknown')
                })

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=settings.DOWNLOAD_TIMEOUT
            )

            if result.returncode != 0:
                raise Exception(f"scdl download failed: {result.stderr}")

            # Find the downloaded file
            # scdl saves as "{artist} - {title}.mp3"
            expected_filename = f"{info['artist']} - {info['title']}.mp3"
            expected_filename = self._sanitize_filename(expected_filename)
            downloaded_file = output_dir / expected_filename

            # If custom filename provided, rename
            if output_filename:
                custom_file = output_dir / f"{self._sanitize_filename(output_filename)}.mp3"
                if downloaded_file.exists():
                    downloaded_file.rename(custom_file)
                    downloaded_file = custom_file

            if self.progress_callback:
                self.progress_callback({
                    'status': 'completed',
                    'file_path': str(downloaded_file)
                })

            return {
                'success': True,
                'file_path': str(downloaded_file),
                'title': info.get('title'),
                'artist': info.get('artist'),
                'duration': info.get('duration', 0),
                'source': 'soundcloud'
            }

        except subprocess.TimeoutExpired:
            raise Exception("SoundCloud download timed out")
        except Exception as e:
            logger.error(f"Error downloading SoundCloud track {url}: {e}")
            raise

    def download_playlist(self, url: str) -> List[Dict]:
        """
        Download entire SoundCloud playlist

        Args:
            url: SoundCloud playlist URL

        Returns:
            List of download results for each track

        Raises:
            Exception: If playlist download fails
        """
        try:
            # Extract playlist info
            playlist_info = self.extract_info(url)

            if playlist_info['type'] != 'playlist':
                raise ValueError("URL is not a playlist")

            logger.info(f"Downloading SoundCloud playlist: {playlist_info['title']}")

            # Create playlist subfolder
            playlist_folder = self.download_dir / self._sanitize_filename(playlist_info['title'])
            playlist_folder.mkdir(parents=True, exist_ok=True)

            # Build scdl command for playlist
            cmd = self._get_scdl_command(url, str(playlist_folder))

            # Track progress
            if self.progress_callback:
                self.progress_callback({
                    'status': 'playlist_start',
                    'title': playlist_info['title'],
                    'total': playlist_info.get('total_tracks', 0)
                })

            # Execute download
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=settings.DOWNLOAD_TIMEOUT
            )

            # Parse output to get individual files
            downloaded_files = []
            for file in playlist_folder.glob("*.mp3"):
                downloaded_files.append({
                    'success': True,
                    'file_path': str(file),
                    'title': file.stem,
                    'source': 'soundcloud'
                })

            if self.progress_callback:
                self.progress_callback({
                    'status': 'completed',
                    'total_downloaded': len(downloaded_files)
                })

            return downloaded_files

        except subprocess.TimeoutExpired:
            raise Exception("SoundCloud playlist download timed out")
        except Exception as e:
            logger.error(f"Error downloading SoundCloud playlist {url}: {e}")
            raise

    def download_user_tracks(self, url: str, max_tracks: Optional[int] = None) -> List[Dict]:
        """
        Download tracks from a SoundCloud user

        Args:
            url: SoundCloud user URL
            max_tracks: Maximum number of tracks to download (None for all)

        Returns:
            List of download results

        Raises:
            Exception: If user tracks download fails
        """
        try:
            # Extract user info
            logger.info(f"Downloading tracks from SoundCloud user: {url}")

            # Create user folder
            user_folder = self.download_dir / "user_tracks"
            user_folder.mkdir(parents=True, exist_ok=True)

            # Build scdl command
            cmd = self._get_scdl_command(url, str(user_folder))

            # Add limit if specified
            if max_tracks:
                cmd.extend(["--limit", str(max_tracks)])

            # Track progress
            if self.progress_callback:
                self.progress_callback({
                    'status': 'user_download_start',
                    'url': url
                })

            # Execute download
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=settings.DOWNLOAD_TIMEOUT
            )

            # Get downloaded files
            downloaded_files = []
            for file in user_folder.glob("*.mp3"):
                downloaded_files.append({
                    'success': True,
                    'file_path': str(file),
                    'title': file.stem,
                    'source': 'soundcloud'
                })

            if self.progress_callback:
                self.progress_callback({
                    'status': 'completed',
                    'total_downloaded': len(downloaded_files)
                })

            return downloaded_files

        except subprocess.TimeoutExpired:
            raise Exception("SoundCloud user download timed out")
        except Exception as e:
            logger.error(f"Error downloading SoundCloud user tracks {url}: {e}")
            raise

    def _sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename to remove invalid characters

        Args:
            filename: Original filename

        Returns:
            Sanitized filename
        """
        # Remove invalid characters
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            filename = filename.replace(char, '')

        # Remove leading/trailing spaces and dots
        filename = filename.strip('. ')

        # Limit length
        max_length = 200
        if len(filename) > max_length:
            filename = filename[:max_length]

        return filename

    def validate_url(self, url: str) -> bool:
        """
        Validate if URL is a valid SoundCloud URL

        Args:
            url: URL to validate

        Returns:
            True if valid, False otherwise
        """
        soundcloud_domains = [
            'soundcloud.com',
            'www.soundcloud.com',
            'm.soundcloud.com'
        ]

        return any(domain in url for domain in soundcloud_domains)

    def check_whitelist(self, url: str) -> bool:
        """
        Check if URL is from a whitelisted SoundCloud user

        Args:
            url: SoundCloud URL to check

        Returns:
            True if whitelisted or whitelist disabled, False otherwise
        """
        if not settings.WHITELIST_ENABLED or not settings.WHITELISTED_SOUNDCLOUD:
            return True

        try:
            # Extract user from URL
            # SoundCloud URLs: https://soundcloud.com/username/track-name
            parts = url.split('soundcloud.com/')
            if len(parts) > 1:
                username = parts[1].split('/')[0]

                # Check if username is whitelisted
                for whitelisted in settings.WHITELISTED_SOUNDCLOUD:
                    if username.lower() == whitelisted.lower():
                        return True

            logger.warning(f"SoundCloud user not in whitelist: {url}")
            return False

        except Exception as e:
            logger.error(f"Error checking SoundCloud whitelist: {e}")
            return False

    def check_scdl_installed(self) -> bool:
        """
        Check if scdl is installed and accessible

        Returns:
            True if scdl is installed, False otherwise
        """
        try:
            result = subprocess.run(
                ["scdl", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
