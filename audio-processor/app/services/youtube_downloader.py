"""
YouTube Downloader Service
Uses yt-dlp for robust YouTube downloading
"""

import os
import logging
from pathlib import Path
from typing import Dict, List, Optional, Callable
from datetime import datetime
import yt_dlp
from ..config import settings

logger = logging.getLogger(__name__)


class YouTubeDownloader:
    """YouTube audio downloader using yt-dlp"""

    def __init__(self, progress_callback: Optional[Callable] = None):
        """
        Initialize YouTube downloader

        Args:
            progress_callback: Function to call with progress updates
        """
        self.progress_callback = progress_callback
        self.download_dir = settings.DOWNLOAD_DIR / "youtube"
        self.temp_dir = settings.TEMP_DIR

    def _get_yt_dlp_options(self, output_path: str) -> Dict:
        """
        Generate yt-dlp configuration options

        Args:
            output_path: Where to save the downloaded file

        Returns:
            Dictionary of yt-dlp options
        """
        return {
            # Output settings
            'outtmpl': output_path,
            'format': 'bestaudio/best',

            # Audio extraction
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': settings.AUDIO_FORMAT,
                'preferredquality': str(settings.AUDIO_BITRATE),
            }],

            # Metadata
            'writethumbnail': True,
            'embedthumbnail': True,
            'addmetadata': True,

            # Network settings
            'socket_timeout': settings.DOWNLOAD_TIMEOUT,
            'retries': settings.RETRY_ATTEMPTS,
            'fragment_retries': settings.RETRY_ATTEMPTS,

            # Rate limiting
            'sleep_interval': 1,
            'max_sleep_interval': 5,

            # User agent rotation
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',

            # Logging
            'quiet': not settings.DEBUG,
            'no_warnings': not settings.DEBUG,
            'logger': logger,

            # Progress hook
            'progress_hooks': [self._progress_hook],

            # Cookie file (for age-restricted content)
            'cookiefile': None,  # Add path if needed

            # Proxy (if needed)
            'proxy': None,
        }

    def _progress_hook(self, d: Dict):
        """
        Hook for yt-dlp progress updates

        Args:
            d: Progress dictionary from yt-dlp
        """
        if d['status'] == 'downloading':
            if self.progress_callback:
                progress_info = {
                    'status': 'downloading',
                    'downloaded_bytes': d.get('downloaded_bytes', 0),
                    'total_bytes': d.get('total_bytes') or d.get('total_bytes_estimate', 0),
                    'speed': d.get('speed', 0),
                    'eta': d.get('eta', 0),
                    'percent': d.get('_percent_str', '0%').strip().replace('%', '')
                }
                self.progress_callback(progress_info)

        elif d['status'] == 'finished':
            if self.progress_callback:
                self.progress_callback({
                    'status': 'processing',
                    'message': 'Converting to MP3...'
                })

    def extract_info(self, url: str) -> Dict:
        """
        Extract video/playlist information without downloading

        Args:
            url: YouTube URL

        Returns:
            Dictionary with video/playlist metadata

        Raises:
            Exception: If extraction fails
        """
        try:
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': 'in_playlist',
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

                # Check if it's a playlist
                if 'entries' in info:
                    return {
                        'type': 'playlist',
                        'title': info.get('title', 'Unknown Playlist'),
                        'uploader': info.get('uploader', 'Unknown'),
                        'uploader_id': info.get('uploader_id'),
                        'total_videos': len(info['entries']),
                        'entries': [
                            {
                                'title': entry.get('title', 'Unknown'),
                                'id': entry.get('id'),
                                'url': entry.get('url'),
                                'duration': entry.get('duration', 0)
                            }
                            for entry in info['entries'] if entry
                        ]
                    }
                else:
                    return {
                        'type': 'video',
                        'title': info.get('title', 'Unknown'),
                        'uploader': info.get('uploader', 'Unknown'),
                        'uploader_id': info.get('uploader_id'),
                        'duration': info.get('duration', 0),
                        'thumbnail': info.get('thumbnail'),
                        'description': info.get('description', ''),
                        'upload_date': info.get('upload_date')
                    }

        except Exception as e:
            logger.error(f"Error extracting YouTube info from {url}: {e}")
            raise

    def download_single(self, url: str, output_filename: Optional[str] = None) -> Dict:
        """
        Download a single YouTube video as audio

        Args:
            url: YouTube video URL
            output_filename: Custom filename (without extension)

        Returns:
            Dictionary with download results

        Raises:
            Exception: If download fails
        """
        try:
            # Extract info first
            info = self.extract_info(url)

            # Generate output path
            if output_filename:
                filename = output_filename
            else:
                filename = f"{info['uploader']} - {info['title']}"
                # Sanitize filename
                filename = self._sanitize_filename(filename)

            output_path = str(self.download_dir / f"{filename}.%(ext)s")

            # Download with yt-dlp
            ydl_opts = self._get_yt_dlp_options(output_path)

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                download_info = ydl.extract_info(url, download=True)

                # Find the downloaded file
                downloaded_file = str(self.download_dir / f"{filename}.{settings.AUDIO_FORMAT}")

                return {
                    'success': True,
                    'file_path': downloaded_file,
                    'title': download_info.get('title'),
                    'artist': download_info.get('uploader'),
                    'duration': download_info.get('duration', 0),
                    'thumbnail': download_info.get('thumbnail'),
                    'upload_date': download_info.get('upload_date')
                }

        except Exception as e:
            logger.error(f"Error downloading YouTube video {url}: {e}")
            raise

    def download_playlist(self, url: str) -> List[Dict]:
        """
        Download entire YouTube playlist

        Args:
            url: YouTube playlist URL

        Returns:
            List of download results for each video

        Raises:
            Exception: If playlist download fails
        """
        try:
            # Extract playlist info
            playlist_info = self.extract_info(url)

            if playlist_info['type'] != 'playlist':
                raise ValueError("URL is not a playlist")

            results = []
            total = len(playlist_info['entries'])

            logger.info(f"Downloading playlist: {playlist_info['title']} ({total} videos)")

            # Create playlist subfolder
            playlist_folder = self.download_dir / self._sanitize_filename(playlist_info['title'])
            playlist_folder.mkdir(exist_ok=True)

            # Download each video
            for index, entry in enumerate(playlist_info['entries'], 1):
                try:
                    if self.progress_callback:
                        self.progress_callback({
                            'status': 'playlist_progress',
                            'current': index,
                            'total': total,
                            'title': entry['title']
                        })

                    video_url = f"https://www.youtube.com/watch?v={entry['id']}"
                    filename = f"{index:03d} - {entry['title']}"
                    filename = self._sanitize_filename(filename)

                    output_path = str(playlist_folder / f"{filename}.%(ext)s")
                    ydl_opts = self._get_yt_dlp_options(output_path)

                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        ydl.download([video_url])

                    results.append({
                        'success': True,
                        'index': index,
                        'title': entry['title'],
                        'file_path': str(playlist_folder / f"{filename}.{settings.AUDIO_FORMAT}")
                    })

                except Exception as e:
                    logger.error(f"Error downloading video {entry['title']}: {e}")
                    results.append({
                        'success': False,
                        'index': index,
                        'title': entry['title'],
                        'error': str(e)
                    })

            return results

        except Exception as e:
            logger.error(f"Error downloading YouTube playlist {url}: {e}")
            raise

    def download_channel(self, url: str, max_videos: Optional[int] = None) -> List[Dict]:
        """
        Download videos from a YouTube channel

        Args:
            url: YouTube channel URL
            max_videos: Maximum number of videos to download (None for all)

        Returns:
            List of download results

        Raises:
            Exception: If channel download fails
        """
        try:
            # Convert channel URL to videos URL
            if '/channel/' in url or '/@' in url or '/c/' in url:
                videos_url = f"{url}/videos"
            else:
                videos_url = url

            # Extract channel info
            ydl_opts = {
                'quiet': True,
                'extract_flat': True,
                'playlistend': max_videos if max_videos else None
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(videos_url, download=False)

                channel_name = info.get('uploader') or info.get('channel') or 'Unknown Channel'
                entries = info.get('entries', [])

                if max_videos:
                    entries = entries[:max_videos]

                logger.info(f"Downloading {len(entries)} videos from channel: {channel_name}")

                # Create channel folder
                channel_folder = self.download_dir / self._sanitize_filename(channel_name)
                channel_folder.mkdir(exist_ok=True)

                results = []
                total = len(entries)

                for index, entry in enumerate(entries, 1):
                    try:
                        if self.progress_callback:
                            self.progress_callback({
                                'status': 'channel_progress',
                                'current': index,
                                'total': total,
                                'title': entry.get('title', 'Unknown')
                            })

                        video_url = f"https://www.youtube.com/watch?v={entry['id']}"
                        filename = f"{index:03d} - {entry['title']}"
                        filename = self._sanitize_filename(filename)

                        output_path = str(channel_folder / f"{filename}.%(ext)s")
                        download_opts = self._get_yt_dlp_options(output_path)

                        with yt_dlp.YoutubeDL(download_opts) as ydl_download:
                            ydl_download.download([video_url])

                        results.append({
                            'success': True,
                            'index': index,
                            'title': entry['title'],
                            'file_path': str(channel_folder / f"{filename}.{settings.AUDIO_FORMAT}")
                        })

                    except Exception as e:
                        logger.error(f"Error downloading video {entry.get('title')}: {e}")
                        results.append({
                            'success': False,
                            'index': index,
                            'title': entry.get('title'),
                            'error': str(e)
                        })

                return results

        except Exception as e:
            logger.error(f"Error downloading YouTube channel {url}: {e}")
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
        Validate if URL is a valid YouTube URL

        Args:
            url: URL to validate

        Returns:
            True if valid, False otherwise
        """
        youtube_domains = [
            'youtube.com',
            'youtu.be',
            'www.youtube.com',
            'm.youtube.com'
        ]

        return any(domain in url for domain in youtube_domains)

    def check_whitelist(self, url: str) -> bool:
        """
        Check if URL is from a whitelisted channel

        Args:
            url: YouTube URL to check

        Returns:
            True if whitelisted or whitelist disabled, False otherwise
        """
        if not settings.WHITELIST_ENABLED or not settings.WHITELISTED_CHANNELS:
            return True

        try:
            info = self.extract_info(url)
            uploader_id = info.get('uploader_id')

            if uploader_id in settings.WHITELISTED_CHANNELS:
                return True

            logger.warning(f"Channel {uploader_id} is not whitelisted")
            return False

        except Exception as e:
            logger.error(f"Error checking whitelist: {e}")
            return False
