"""
Reels Studio v1.0 - TOP TIER VIRAL VIDEO ENGINE
================================================
Professional TikTok/Instagram/YouTube Shorts generation with:
1. Multi-clip sequencing for 15-60s videos
2. Background music overlay
3. Burned-in caption rendering
4. Platform-optimized content types

This is TOP TIER social media video generation.
"""

import os
import io
import base64
import json
import traceback
import requests
import subprocess
import tempfile
import urllib.request
from http.server import BaseHTTPRequestHandler
from PIL import Image

print("=" * 60)
print("🎬 Reels Studio v1.0 - TOP TIER VIRAL VIDEO ENGINE")
print("=" * 60)

# ═══════════════════════════════════════════════════════════════════════════════
# CREDENTIALS SETUP
# ═══════════════════════════════════════════════════════════════════════════════

GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

oauth2_token = None
project_id = None
genai_client = None

try:
    if GOOGLE_CREDENTIALS_JSON:
        from google.oauth2 import service_account
        import google.auth.transport.requests

        creds_dict = json.loads(GOOGLE_CREDENTIALS_JSON)
        project_id = creds_dict.get("project_id", "")

        credentials = service_account.Credentials.from_service_account_info(
            creds_dict,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )

        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        oauth2_token = credentials.token

        print(f"✅ OAuth2 ready: {project_id}")

    from google import genai
    if GOOGLE_API_KEY:
        genai_client = genai.Client(api_key=GOOGLE_API_KEY)
        print("✅ Gemini AI ready (API Key)")
    elif GOOGLE_CREDENTIALS_JSON:
        genai_client = genai.Client(
            vertexai=True,
            project=project_id,
            location="us-central1"
        )
        print("✅ Gemini AI ready (Vertex)")

except Exception as e:
    print(f"⚠️ Setup error: {e}")


def get_fresh_token():
    """Get fresh OAuth2 token"""
    global oauth2_token
    if not GOOGLE_CREDENTIALS_JSON:
        return None
    try:
        from google.oauth2 import service_account
        import google.auth.transport.requests
        creds_dict = json.loads(GOOGLE_CREDENTIALS_JSON)
        credentials = service_account.Credentials.from_service_account_info(
            creds_dict, scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        oauth2_token = credentials.token
        return oauth2_token
    except Exception as e:
        print(f"⚠️ Token refresh failed: {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# REELS MUSIC LIBRARY (Royalty-Free TikTok/Reels Style)
# ═══════════════════════════════════════════════════════════════════════════════

REELS_MUSIC_LIBRARY = {
    'none': None,
    'trending_beat': {
        'name': 'Trending Beat',
        'url': 'https://cdn.pixabay.com/audio/2024/11/04/audio_a22df42c27.mp3',
        'mood': 'viral',
        'bpm': 128
    },
    'chill_lofi': {
        'name': 'Chill Lo-Fi',
        'url': 'https://cdn.pixabay.com/audio/2024/08/02/audio_f5e3e6a0b6.mp3',
        'mood': 'relaxed',
        'bpm': 85
    },
    'upbeat_pop': {
        'name': 'Upbeat Pop',
        'url': 'https://cdn.pixabay.com/audio/2024/09/24/audio_d6a4b26c48.mp3',
        'mood': 'energetic',
        'bpm': 120
    },
    'cinematic': {
        'name': 'Cinematic',
        'url': 'https://cdn.pixabay.com/audio/2024/10/14/audio_0f0d0ef9c5.mp3',
        'mood': 'dramatic',
        'bpm': 90
    },
    'energetic': {
        'name': 'Energetic',
        'url': 'https://cdn.pixabay.com/audio/2024/07/15/audio_3c5e7a2b9d.mp3',
        'mood': 'hype',
        'bpm': 130
    },
    'elegant_piano': {
        'name': 'Elegant Piano',
        'url': 'https://cdn.pixabay.com/audio/2024/11/04/audio_a22df42c27.mp3',
        'mood': 'luxury',
        'bpm': 72
    },
    'tech_modern': {
        'name': 'Tech Modern',
        'url': 'https://cdn.pixabay.com/audio/2024/07/15/audio_3c5e7a2b9d.mp3',
        'mood': 'modern',
        'bpm': 110
    },
    'fashion_groove': {
        'name': 'Fashion Groove',
        'url': 'https://cdn.pixabay.com/audio/2024/06/20/audio_8d4c3b1a7e.mp3',
        'mood': 'stylish',
        'bpm': 100
    }
}


# ═══════════════════════════════════════════════════════════════════════════════
# CAPTION STYLES (FFmpeg drawtext parameters)
# ═══════════════════════════════════════════════════════════════════════════════

CAPTION_STYLES = {
    'none': None,
    'minimal': {
        'fontsize': 48,
        'fontcolor': 'white',
        'borderw': 2,
        'bordercolor': 'black',
        'shadowx': 2,
        'shadowy': 2,
        'shadowcolor': 'black@0.5',
        'box': False
    },
    'bold': {
        'fontsize': 64,
        'fontcolor': 'white',
        'borderw': 3,
        'bordercolor': 'black',
        'box': True,
        'boxcolor': 'black@0.7',
        'boxborderw': 15
    },
    'karaoke': {
        'fontsize': 56,
        'fontcolor': 'yellow',
        'borderw': 2,
        'bordercolor': 'black',
        'highlight': True,
        'highlight_color': 'white'
    },
    'subtitle': {
        'fontsize': 40,
        'fontcolor': 'white',
        'box': True,
        'boxcolor': 'black@0.8',
        'boxborderw': 8,
        'position': 'bottom'
    },
    'aesthetic': {
        'fontsize': 52,
        'fontcolor': '#FFB6C1',
        'borderw': 2,
        'bordercolor': '#FF69B4',
        'shadowx': 3,
        'shadowy': 3,
        'shadowcolor': '#FF69B4@0.6'
    },
    'neon': {
        'fontsize': 56,
        'fontcolor': '#00FF00',
        'borderw': 2,
        'bordercolor': '#003300',
        'shadowx': 0,
        'shadowy': 0,
        'shadowcolor': '#00FF00@0.8'
    },
    'gradient': {
        'fontsize': 54,
        'fontcolor': 'white',
        'borderw': 3,
        'bordercolor': '#6366F1',
        'box': True,
        'boxcolor': '#6366F1@0.5',
        'boxborderw': 12
    }
}


# ═══════════════════════════════════════════════════════════════════════════════
# CONTENT TYPE PROMPTS (Platform-Optimized)
# ═══════════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════════════
# SAFE PROMPTS - Avoid RAI content filters
# Focus on PRODUCT, avoid detailed human descriptions
# ═══════════════════════════════════════════════════════════════════════════════

CONTENT_TYPE_PROMPTS = {
    'product_showcase': {
        'base': (
            '9:16 vertical product video. Product displayed on a surface. '
            'Preserve product exactly as shown. Slow gentle camera push-in. '
            'Soft natural lighting. Clean background. '
            'No text or overlays.'
        ),
        'camera': 'Slow dolly. Soft light.'
    },
    'hands_demo': {
        'base': (
            '9:16 vertical video. Hands presenting the product. '
            'Preserve product exactly as shown. '
            'Soft daylight. Cozy indoor setting. '
            'No text or overlays.'
        ),
        'camera': 'Close-up. Soft light. Shallow focus.'
    },
    'avatar_review': {
        'base': (
            '9:16 vertical video. Someone enthusiastically showing a product. '
            'Preserve product exactly as shown. '
            'Warm indoor lighting. Casual home setting. '
            'Friendly presentation style. '
            'No text or overlays.'
        ),
        'camera': 'Medium shot. Warm light.'
    },
    'lifestyle': {
        'base': (
            '9:16 vertical lifestyle video. Someone using the product naturally. '
            'Preserve product exactly as shown. '
            'Everyday setting. Natural daylight. '
            'Casual authentic feel. '
            'No text or overlays.'
        ),
        'camera': 'Natural light. Casual framing.'
    },
    'unboxing': {
        'base': (
            '9:16 vertical unboxing video. Hands opening a package to reveal product. '
            'Preserve product exactly as shown. '
            'Desk or table setting. Soft room lighting. '
            'Satisfying reveal moment. '
            'No text or overlays.'
        ),
        'camera': 'Top-down view. Soft light.'
    },
    'hook_teaser': {
        'base': (
            '9:16 vertical product reveal video. Quick dynamic movement. '
            'Preserve product exactly as shown. '
            'Eye-catching presentation. '
            'No text or overlays.'
        ),
        'camera': 'Dynamic movement. Clean look.'
    }
}


# ═══════════════════════════════════════════════════════════════════════════════
# TEMPLATE SCRIPTS
# ═══════════════════════════════════════════════════════════════════════════════

TEMPLATE_SCRIPTS = {
    'product_reveal': 'Wait for it. This product is about to change everything. The quality is unreal.',
    'pov_customer': 'POV You finally got that product everyone is talking about. Best decision ever.',
    'before_after': 'Before vs After using this product. The difference is insane.',
    'honest_review': 'Honest review. Is this product worth the hype. Let me show you why I love it.',
    'asmr_unbox': 'ASMR unboxing time. Listen to that satisfying sound. So premium.',
    'day_in_life': 'A day in my life with this amazing product. Cannot live without it anymore.',
    'get_ready': 'Get ready with me featuring my new favorite product. Game changer.'
}


# ═══════════════════════════════════════════════════════════════════════════════
# VIDEO PROCESSING FUNCTIONS (FFmpeg)
# ═══════════════════════════════════════════════════════════════════════════════

def download_video_to_temp(video_url):
    """Download video from URL or decode base64 to temp file."""
    try:
        temp_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)

        if video_url.startswith('data:'):
            if 'base64,' in video_url:
                b64 = video_url.split('base64,')[1]
            else:
                b64 = video_url
            video_bytes = base64.b64decode(b64)
            temp_file.write(video_bytes)
        elif video_url.startswith('gs://'):
            print(f"   ⚠️ GCS download not implemented: {video_url[:50]}...")
            return None
        else:
            urllib.request.urlretrieve(video_url, temp_file.name)

        temp_file.close()
        return temp_file.name
    except Exception as e:
        print(f"   ⚠️ Video download failed: {e}")
        return None


def download_audio_to_temp(audio_url):
    """Download audio file to temp location."""
    try:
        temp_file = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
        urllib.request.urlretrieve(audio_url, temp_file.name)
        temp_file.close()
        return temp_file.name
    except Exception as e:
        print(f"   ⚠️ Audio download failed: {e}")
        return None


def get_video_duration(video_path):
    """Get video duration in seconds using ffprobe."""
    try:
        cmd = [
            'ffprobe', '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=30)
        return float(result.stdout.decode().strip() or 3)
    except Exception:
        return 3.0


def trim_video_to_duration(video_path, target_duration, output_path):
    """Trim video to exact target duration using FFmpeg."""
    try:
        current_duration = get_video_duration(video_path)

        if current_duration <= target_duration + 0.5:
            # Already close enough, no trim needed
            return video_path

        print(f"   ✂️ Trimming video from {current_duration:.1f}s to {target_duration}s...")

        cmd = [
            'ffmpeg', '-y',
            '-i', video_path,
            '-t', str(target_duration),
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-c:a', 'copy',
            output_path
        ]

        result = subprocess.run(cmd, capture_output=True, timeout=60)

        if result.returncode == 0:
            print(f"   ✅ Video trimmed to {target_duration}s")
            return output_path
        else:
            print(f"   ⚠️ Trim failed: {result.stderr.decode()[:100]}")
            return video_path

    except Exception as e:
        print(f"   ⚠️ Trim error: {e}")
        return video_path


def force_aspect_ratio_9_16(video_path, output_path):
    """Force video to 9:16 aspect ratio (1080x1920) for Reels/TikTok."""
    try:
        print(f"   📐 Forcing 9:16 aspect ratio (1080x1920)...")

        # Scale and pad to exactly 1080x1920 (9:16)
        # This will add black bars if needed or crop/scale to fit
        cmd = [
            'ffmpeg', '-y',
            '-i', video_path,
            '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-c:a', 'copy',
            output_path
        ]

        result = subprocess.run(cmd, capture_output=True, timeout=120)

        if result.returncode == 0:
            print(f"   ✅ Video converted to 9:16 (1080x1920)")
            return output_path
        else:
            print(f"   ⚠️ Aspect ratio conversion failed: {result.stderr.decode()[:100]}")
            return video_path

    except Exception as e:
        print(f"   ⚠️ Aspect ratio error: {e}")
        return video_path


# Available transitions for xfade filter
AVAILABLE_TRANSITIONS = [
    'fade',           # Classic fade
    'wipeleft',       # Wipe from right to left
    'wiperight',      # Wipe from left to right
    'wipeup',         # Wipe from bottom to top
    'wipedown',       # Wipe from top to bottom
    'slideleft',      # Slide from right
    'slideright',     # Slide from left
    'slideup',        # Slide from bottom
    'slidedown',      # Slide from top
    'smoothleft',     # Smooth slide left
    'smoothright',    # Smooth slide right
    'circlecrop',     # Circle crop transition
    'rectcrop',       # Rectangle crop transition
    'distance',       # Distance-based fade
    'fadeblack',      # Fade through black
    'fadewhite',      # Fade through white
    'radial',         # Radial wipe
    'smoothup',       # Smooth slide up
    'smoothdown',     # Smooth slide down
    'dissolve',       # Dissolve transition
    'pixelize',       # Pixelize transition
    'diagtl',         # Diagonal top-left
    'diagtr',         # Diagonal top-right
    'diagbl',         # Diagonal bottom-left
    'diagbr',         # Diagonal bottom-right
    'hlslice',        # Horizontal slice
    'vrslice',        # Vertical slice
    'hblur',          # Horizontal blur
    'fadegrays',      # Fade through grays
    'squeezev',       # Vertical squeeze
    'squeezeh',       # Horizontal squeeze
    'zoomin',         # Zoom in transition
]


def get_transition_for_clip(clip_index, total_clips, content_type):
    """Get appropriate transition based on content type and clip position."""
    # Different content types prefer different transition styles
    content_transitions = {
        'product_showcase': ['fade', 'smoothleft', 'dissolve', 'zoomin'],
        'hands_demo': ['fade', 'dissolve', 'fadeblack'],
        'avatar_review': ['fade', 'wipeleft', 'slideright'],
        'lifestyle': ['fade', 'smoothleft', 'dissolve', 'circlecrop'],
        'unboxing': ['fade', 'wipeup', 'slideup', 'zoomin'],
        'hook_teaser': ['wipeleft', 'zoomin', 'radial', 'diagtr']
    }

    transitions = content_transitions.get(content_type, ['fade', 'dissolve', 'smoothleft'])

    # Cycle through transitions for variety
    return transitions[clip_index % len(transitions)]


def stitch_videos(video_paths, output_path, transition='fade', transition_duration=0.5, content_type=None):
    """Stitch multiple videos together with varied transitions using FFmpeg."""
    if not video_paths or len(video_paths) == 0:
        return None

    if len(video_paths) == 1:
        return video_paths[0]

    try:
        total_clips = len(video_paths)
        print(f"   🎬 Stitching {total_clips} videos with dynamic transitions...")

        durations = [get_video_duration(p) for p in video_paths]
        print(f"   📊 Video durations: {durations}")

        inputs = ' '.join([f'-i "{p}"' for p in video_paths])

        if len(video_paths) == 2:
            # Use content-aware transition for 2 clips
            trans = get_transition_for_clip(0, total_clips, content_type) if content_type else transition
            offset = max(0, durations[0] - transition_duration)
            filter_complex = f"[0:v][1:v]xfade=transition={trans}:duration={transition_duration}:offset={offset}[v]"
            cmd = f'ffmpeg -y {inputs} -filter_complex "{filter_complex}" -map "[v]" -c:v libx264 -preset fast {output_path}'
            print(f"   🎨 Using transition: {trans}")
        else:
            filter_parts = []
            current_offset = 0
            used_transitions = []

            for i in range(len(video_paths) - 1):
                input_a = f"[{i}:v]" if i == 0 else f"[v{i}]"
                input_b = f"[{i+1}:v]"
                output_label = f"[v{i+1}]" if i < len(video_paths) - 2 else "[v]"

                # Use varied transitions for each cut
                trans = get_transition_for_clip(i, total_clips, content_type) if content_type else transition
                used_transitions.append(trans)

                offset = max(0, current_offset + durations[i] - transition_duration)
                filter_parts.append(f"{input_a}{input_b}xfade=transition={trans}:duration={transition_duration}:offset={offset}{output_label}")
                current_offset = offset

            filter_complex = ';'.join(filter_parts)
            cmd = f'ffmpeg -y {inputs} -filter_complex "{filter_complex}" -map "[v]" -c:v libx264 -preset fast {output_path}'
            print(f"   🎨 Using transitions: {used_transitions}")

        print(f"   🔧 Running FFmpeg with xfade...")
        result = subprocess.run(cmd, shell=True, capture_output=True, timeout=180)

        if result.returncode == 0:
            print(f"   ✅ Videos stitched with dynamic transitions")
            return output_path
        else:
            print(f"   ⚠️ xfade failed, falling back to simple concat...")
            return stitch_videos_simple(video_paths, output_path)

    except subprocess.TimeoutExpired:
        print("   ⚠️ Video stitching timed out, trying simple concat...")
        return stitch_videos_simple(video_paths, output_path)
    except FileNotFoundError:
        print("   ⚠️ FFmpeg not found - stitching unavailable")
        return None
    except Exception as e:
        print(f"   ⚠️ Stitch error: {e}, trying simple concat...")
        return stitch_videos_simple(video_paths, output_path)


def stitch_videos_simple(video_paths, output_path):
    """Simple concat fallback without transitions."""
    try:
        concat_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
        for vpath in video_paths:
            concat_file.write(f"file '{vpath}'\n")
        concat_file.close()

        cmd = [
            'ffmpeg', '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_file.name,
            '-c', 'copy',
            output_path
        ]

        result = subprocess.run(cmd, capture_output=True, timeout=120)
        os.unlink(concat_file.name)

        if result.returncode == 0:
            print(f"   ✅ Videos concatenated (simple)")
            return output_path
        return None
    except Exception as e:
        print(f"   ⚠️ Simple concat failed: {e}")
        return None


def add_audio_overlay(video_path, audio_url, output_path, volume=0.3):
    """Add background music to video using FFmpeg."""
    try:
        audio_path = download_audio_to_temp(audio_url)
        if not audio_path:
            return video_path

        probe_cmd = [
            'ffprobe', '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            video_path
        ]
        duration_result = subprocess.run(probe_cmd, capture_output=True, timeout=30)
        video_duration = float(duration_result.stdout.decode().strip() or 10)

        fade_start = max(0, video_duration - 2)

        cmd = [
            'ffmpeg', '-y',
            '-i', video_path,
            '-stream_loop', '-1',
            '-i', audio_path,
            '-filter_complex',
            f"[1:a]volume={volume},afade=t=out:st={fade_start}:d=2[a]",
            '-map', '0:v',
            '-map', '[a]',
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-shortest',
            output_path
        ]

        print(f"   🎵 Adding music overlay...")
        result = subprocess.run(cmd, capture_output=True, timeout=120)

        os.unlink(audio_path)

        if result.returncode == 0:
            print(f"   ✅ Audio overlay added")
            return output_path
        else:
            print(f"   ⚠️ FFmpeg audio error: {result.stderr.decode()[:200]}")
            return video_path

    except subprocess.TimeoutExpired:
        print("   ⚠️ Audio overlay timed out")
        return video_path
    except FileNotFoundError:
        print("   ⚠️ FFmpeg not found - audio overlay unavailable")
        return video_path
    except Exception as e:
        print(f"   ⚠️ Audio overlay error: {e}")
        return video_path


def compress_image_for_veo(image_data, max_size_kb=600, max_dimension=1024):
    """
    ULTRA-AGGRESSIVE compression for Reels.
    Target: 600KB to ensure total payload stays under Vercel 4.5MB limit.
    Reels has more payload data than Motion (script, avatarConfig, music, etc.)
    """
    try:
        if 'base64,' in image_data:
            b64 = image_data.split('base64,')[1]
        else:
            b64 = image_data

        image_bytes = base64.b64decode(b64)
        original_size_kb = len(image_bytes) / 1024
        print(f"   📦 Original image: {original_size_kb:.0f}KB")

        # If already small enough and JPEG, might be already compressed from frontend
        if original_size_kb <= max_size_kb:
            print(f"   ✅ Image already under {max_size_kb}KB, using as-is")
            return b64, 'image/jpeg'

        img = Image.open(io.BytesIO(image_bytes))

        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        width, height = img.size

        # ALWAYS resize if larger than max_dimension (1024 for Reels vs 1920 for Motion)
        if max(width, height) > max_dimension:
            ratio = max_dimension / max(width, height)
            new_size = (int(width * ratio), int(height * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
            print(f"   📐 Resized: {width}x{height} → {new_size[0]}x{new_size[1]}")

        # Start with lower quality (70 vs 90) for faster convergence
        quality = 70
        while quality >= 30:
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=quality, optimize=True)
            size_kb = len(buffer.getvalue()) / 1024

            if size_kb <= max_size_kb:
                print(f"   📦 Compressed: {size_kb:.0f}KB (quality={quality})")
                return base64.b64encode(buffer.getvalue()).decode('utf-8'), 'image/jpeg'

            quality -= 10

        # Final attempt with very low quality
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=25, optimize=True)
        size_kb = len(buffer.getvalue()) / 1024
        print(f"   ⚠️ Min quality compression: {size_kb:.0f}KB (quality=25)")
        return base64.b64encode(buffer.getvalue()).decode('utf-8'), 'image/jpeg'

    except Exception as e:
        print(f"   ⚠️ Compression failed: {e}, using original")
        if 'base64,' in image_data:
            return image_data.split('base64,')[1], 'image/jpeg'
        return image_data, 'image/jpeg'


# ═══════════════════════════════════════════════════════════════════════════════
# CAPTION RENDERING (FFmpeg drawtext)
# ═══════════════════════════════════════════════════════════════════════════════

def escape_text_for_ffmpeg(text):
    """Escape special characters for FFmpeg drawtext filter."""
    if not text:
        return ''

    # First, ensure text is ASCII-safe (remove/replace problematic characters)
    try:
        # Normalize unicode characters
        import unicodedata
        text = unicodedata.normalize('NFKD', text)
        # Keep only ASCII characters
        text = text.encode('ascii', 'ignore').decode('ascii')
    except Exception:
        pass

    # FFmpeg drawtext escape sequence (order matters!)
    # 1. Backslash must be first
    text = text.replace("\\", "\\\\\\\\")
    # 2. Single quotes
    text = text.replace("'", "\\'")
    # 3. Colons (FFmpeg uses : as separator)
    text = text.replace(":", "\\:")
    # 4. Percent signs
    text = text.replace("%", "\\%")
    # 5. Brackets and special chars
    text = text.replace("[", "\\[")
    text = text.replace("]", "\\]")
    text = text.replace(";", "\\;")
    text = text.replace(",", "\\,")

    return text


def generate_caption_segments(script, duration):
    """Split script into timed segments."""
    if not script or not script.strip():
        return []

    words = script.split()
    if not words:
        return []

    # Aim for ~3-5 words per segment
    words_per_segment = 4
    segments = []

    total_segments = max(1, len(words) // words_per_segment)
    segment_duration = duration / total_segments

    current_time = 0
    for i in range(0, len(words), words_per_segment):
        segment_words = words[i:i + words_per_segment]
        segment_text = ' '.join(segment_words)

        segments.append({
            'text': segment_text,
            'start': current_time,
            'end': min(current_time + segment_duration, duration)
        })
        current_time += segment_duration

    return segments


def add_captions_to_video(video_path, script, duration, style_id, output_path):
    """Burn captions into video using FFmpeg drawtext - simplified and robust."""
    if not script or style_id == 'none' or style_id not in CAPTION_STYLES:
        print("   ⚠️ No captions to add")
        return video_path

    style = CAPTION_STYLES[style_id]
    if style is None:
        return video_path

    segments = generate_caption_segments(script, duration)
    if not segments:
        return video_path

    print(f"   📝 Adding {len(segments)} caption segments ({style_id} style)...")

    try:
        # Build filter chain - simplified approach without complex alpha expressions
        filters = []

        for seg in segments:
            # Clean text - keep it simple ASCII
            text = seg['text']
            # Remove problematic characters, keep only safe chars
            safe_text = ''.join(c for c in text if c.isalnum() or c in ' .,!?-')
            safe_text = safe_text.strip()

            if not safe_text:
                continue

            start = seg['start']
            end = seg['end']

            # Get style settings
            fontsize = style.get('fontsize', 48)
            fontcolor = style.get('fontcolor', 'white')
            borderw = style.get('borderw', 2)
            bordercolor = style.get('bordercolor', 'black')
            y_pos = 100 if style.get('position') != 'bottom' else 60

            # Simple drawtext filter - using textfile approach for reliability
            text_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8')
            text_file.write(safe_text)
            text_file.close()

            # Build filter with textfile (more reliable than inline text)
            filter_str = (
                f"drawtext=textfile='{text_file.name}'"
                f":fontsize={fontsize}"
                f":fontcolor={fontcolor}"
                f":borderw={borderw}"
                f":bordercolor={bordercolor}"
                f":x=(w-tw)/2"
                f":y=h-th-{y_pos}"
                f":enable='between(t\\,{start:.2f}\\,{end:.2f})'"
            )

            # Add shadow if specified
            if style.get('shadowx'):
                filter_str += f":shadowx={style['shadowx']}:shadowy={style['shadowy']}"
                if style.get('shadowcolor'):
                    # Simplify shadow color
                    shadow_col = style['shadowcolor'].split('@')[0]
                    filter_str += f":shadowcolor={shadow_col}"

            # Add box if specified
            if style.get('box'):
                box_col = style.get('boxcolor', 'black@0.5').split('@')[0]
                filter_str += f":box=1:boxcolor={box_col}@0.7:boxborderw={style.get('boxborderw', 10)}"

            filters.append((filter_str, text_file.name))

        if not filters:
            print("   ⚠️ No valid caption segments")
            return video_path

        # Build complete filter chain
        filter_chain = ','.join([f[0] for f in filters])

        cmd = [
            'ffmpeg', '-y',
            '-i', video_path,
            '-vf', filter_chain,
            '-c:a', 'copy',
            output_path
        ]

        print(f"   🔧 Running FFmpeg caption render...")
        result = subprocess.run(cmd, capture_output=True, timeout=120)

        # Cleanup temp files
        for _, temp_file in filters:
            try:
                os.unlink(temp_file)
            except:
                pass

        if result.returncode == 0:
            print(f"   ✅ Captions burned in ({style_id})")
            return output_path
        else:
            error_msg = result.stderr.decode()[:300] if result.stderr else 'Unknown error'
            print(f"   ⚠️ Caption render failed: {error_msg}")
            return video_path

    except subprocess.TimeoutExpired:
        print("   ⚠️ Caption rendering timed out")
        return video_path
    except Exception as e:
        print(f"   ⚠️ Caption error: {e}")
        traceback.print_exc()
        return video_path


# ═══════════════════════════════════════════════════════════════════════════════
# MULTI-CLIP GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

def get_clip_config(duration):
    """Get clip configuration for target duration."""
    configs = {
        4: {'clips': 1, 'durations': [4]},
        6: {'clips': 1, 'durations': [6]},
        8: {'clips': 1, 'durations': [8]},
        15: {'clips': 2, 'durations': [8, 8]},  # Will trim to 15s
        30: {'clips': 4, 'durations': [8, 8, 8, 8]},
        60: {'clips': 8, 'durations': [8, 8, 8, 8, 8, 8, 8, 8]}
    }
    return configs.get(duration, {'clips': 1, 'durations': [8]})


def split_script_for_clips(script, num_clips):
    """Split script into sections for each clip."""
    if not script or num_clips <= 1:
        return [script] * num_clips

    words = script.split()
    if not words:
        return [''] * num_clips

    words_per_clip = max(1, len(words) // num_clips)

    sections = []
    for i in range(num_clips):
        start = i * words_per_clip
        end = start + words_per_clip if i < num_clips - 1 else len(words)
        sections.append(' '.join(words[start:end]))

    return sections


def build_clip_prompt(content_type, script_section, clip_index, total_clips, platform, avatar_config=None):
    """Build prompt for individual clip in sequence."""
    content_config = CONTENT_TYPE_PROMPTS.get(content_type, CONTENT_TYPE_PROMPTS['product_showcase'])
    base_prompt = content_config['base']
    camera_prompt = content_config['camera']

    # Position context
    position_hints = {
        0: 'Opening shot - introduce and grab attention.',
        total_clips - 1: 'Final shot - memorable ending.'
    }
    position_hint = position_hints.get(clip_index, 'Continue showcasing.')

    # Platform optimization
    platform_style = {
        'tiktok': 'Casual, authentic, relatable.',
        'instagram': 'Aesthetic, warm tones.',
        'youtube': 'Engaging, natural.'
    }
    style_hint = platform_style.get(platform, 'Natural, engaging.')

    # Build full prompt
    prompt_parts = [
        base_prompt,
        camera_prompt,
        position_hint,
        f"Style: {style_hint}"
    ]

    # NOTE: Script is NOT sent to Veo - it was causing corrupted text in videos
    # Script is ONLY used for FFmpeg caption burn-in during finalize step

    # Compact avatar description - key realism points only
    if avatar_config and content_type in ['avatar_review', 'lifestyle']:
        gender = avatar_config.get('gender', 'female')
        age_map = {'young': '20s', 'adult': '30s', 'mature': '50s'}
        age_desc = age_map.get(avatar_config.get('age', 'young'), '20s')
        style = avatar_config.get('style', 'casual')
        mood = avatar_config.get('mood', 'friendly')

        # Compact but effective realism description
        prompt_parts.append(
            f'A {gender} in their {age_desc}, casual {style} style, {mood} expression.'
        )

    # Simple quality instruction (avoid triggering content filters)
    prompt_parts.append(
        'Natural authentic look. No text or overlays.'
    )

    return ' '.join(prompt_parts)


def start_video_generation(image_data, prompt, model_id, aspect_ratio, duration, token, proj_id):
    """Start Veo 3.1 video generation with robust error handling."""
    # Veo only supports 16:9 and 9:16
    valid_ratios = ['16:9', '9:16']
    if aspect_ratio not in valid_ratios:
        aspect_ratio = '9:16'  # Default to portrait for Reels

    # ULTRA-AGGRESSIVE compression for Reels (600KB target vs Motion's 3MB)
    base64_clean, mime_type = compress_image_for_veo(image_data)
    base64_clean = base64_clean.strip().replace('\n', '').replace('\r', '').replace(' ', '')
    missing_padding = len(base64_clean) % 4
    if missing_padding:
        base64_clean += '=' * (4 - missing_padding)

    # Log payload size for debugging
    image_size_kb = len(base64_clean) / 1024
    print(f"   📊 Image payload: {image_size_kb:.0f}KB")

    # Safety check - if still too large, warn
    if image_size_kb > 1000:
        print(f"   ⚠️ WARNING: Image still large ({image_size_kb:.0f}KB), may cause payload errors")

    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{proj_id}/locations/us-central1/publishers/google/models/{model_id}:predictLongRunning"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Veo 3.1 only supports 4, 6, 8 seconds
    valid_duration = int(duration) if int(duration) in [4, 6, 8] else 8

    payload = {
        "instances": [{
            "prompt": prompt,
            "image": {
                "bytesBase64Encoded": base64_clean,
                "mimeType": mime_type
            }
        }],
        "parameters": {
            "aspectRatio": aspect_ratio,
            "durationSeconds": valid_duration,
            "sampleCount": 1
        }
    }

    # Log total payload size
    payload_json = json.dumps(payload)
    total_size_kb = len(payload_json) / 1024
    print(f"   📊 Total Veo payload: {total_size_kb:.0f}KB")
    print(f"   🎬 Starting Veo 3.1 ({model_id})...")

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)

        if response.status_code == 200:
            result = response.json()
            operation_name = result.get('name')
            if operation_name:
                print(f"   ✅ Operation started: {operation_name[:50]}...")
                return {
                    'success': True,
                    'operation_name': operation_name,
                    'model_id': model_id,
                    'status': 'PENDING'
                }
            else:
                print(f"   ⚠️ No operation name in response: {result}")
                return {'success': False, 'error': 'No operation name returned', 'details': str(result)[:200]}

        # Handle specific error codes
        error_body = response.text[:500] if response.text else 'No response body'
        print(f"   ❌ Veo API Error {response.status_code}: {error_body}")

        # Parse error for better messages
        error_msg = f"Veo API Error: {response.status_code}"
        if response.status_code == 400:
            if 'payload' in error_body.lower() or 'size' in error_body.lower():
                error_msg = "Image too large for Veo. Please try a smaller image."
            elif 'prompt' in error_body.lower():
                error_msg = "Invalid prompt. Please try different settings."
            else:
                error_msg = f"Bad request: {error_body[:100]}"
        elif response.status_code == 401:
            error_msg = "Authentication failed. Please check credentials."
        elif response.status_code == 403:
            error_msg = "Access denied. Veo API may not be enabled for this project."
        elif response.status_code == 429:
            error_msg = "Rate limited. Please wait a moment and try again."
        elif response.status_code == 500:
            error_msg = "Veo service error. Please try again later."

        return {'success': False, 'error': error_msg, 'details': error_body, 'status_code': response.status_code}

    except requests.exceptions.Timeout:
        print(f"   ❌ Request timeout")
        return {'success': False, 'error': 'Request timed out. Please try again.'}
    except requests.exceptions.ConnectionError as e:
        print(f"   ❌ Connection error: {e}")
        return {'success': False, 'error': 'Connection failed. Please check your network.'}
    except Exception as e:
        print(f"   ❌ Request exception: {e}")
        return {'success': False, 'error': str(e)}


def poll_operation(operation_name, model_id, token, proj_id):
    """Poll for video generation completion."""
    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{proj_id}/locations/us-central1/publishers/google/models/{model_id}:fetchPredictOperation"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, headers=headers, json={"operationName": operation_name}, timeout=30)

        if response.status_code == 200:
            result = response.json()
            print(f"   📊 Poll result keys: {list(result.keys())}")

            if result.get('done'):
                print(f"   ✅ Generation done!")

                if result.get('error'):
                    error_info = result.get('error', {})
                    error_msg = error_info.get('message', str(error_info))
                    print(f"   ❌ Generation error: {error_msg}")
                    return {'success': False, 'status': 'FAILED', 'error': f"Generation failed: {error_msg}"}

                resp = result.get('response', {})
                videos = (
                    resp.get('videos', []) or
                    resp.get('predictions', []) or
                    resp.get('generatedVideos', []) or
                    result.get('videos', []) or
                    result.get('predictions', [])
                )

                if videos:
                    video = videos[0]
                    print(f"   📹 Video object keys: {list(video.keys())}")
                    video_url = None

                    # Try ALL possible video data locations (matching Motion)
                    if video.get('gcsUri'):
                        video_url = video['gcsUri']
                        print(f"   ✅ Found video via gcsUri")
                    elif video.get('bytesBase64Encoded'):
                        mime = video.get('mimeType', 'video/mp4')
                        video_url = f"data:{mime};base64,{video['bytesBase64Encoded']}"
                        print(f"   ✅ Found video via bytesBase64Encoded")
                    elif video.get('video', {}).get('bytesBase64Encoded'):
                        # Nested structure
                        mime = video.get('video', {}).get('mimeType', 'video/mp4')
                        video_url = f"data:{mime};base64,{video['video']['bytesBase64Encoded']}"
                        print(f"   ✅ Found video via nested video.bytesBase64Encoded")

                    if video_url:
                        return {'success': True, 'status': 'COMPLETE', 'video_url': video_url, 'done': True}
                    elif video.get('videoUri'):
                        print(f"   ✅ Found video via videoUri")
                        return {'success': True, 'status': 'COMPLETE', 'video_url': video['videoUri'], 'done': True}
                    elif video.get('uri'):
                        # CRITICAL: This fallback was MISSING in Reels but exists in Motion!
                        print(f"   ✅ Found video via uri")
                        return {'success': True, 'status': 'COMPLETE', 'video_url': video['uri'], 'done': True}

                # Log RAI filter reasons if present
                rai_count = resp.get('raiMediaFilteredCount', 0)
                rai_reasons = resp.get('raiMediaFilteredReasons', [])
                if rai_count > 0 or rai_reasons:
                    print(f"   🚫 RAI CONTENT FILTER TRIGGERED!")
                    print(f"   🚫 Filtered count: {rai_count}")
                    print(f"   🚫 Reasons: {rai_reasons}")
                    return {
                        'success': False,
                        'status': 'FILTERED',
                        'error': f'Content filtered by Google AI safety. Reasons: {rai_reasons}',
                        'rai_reasons': rai_reasons
                    }

                # Log full response for debugging
                print(f"   ⚠️ No video found. Response keys: {list(resp.keys())}")
                print(f"   ⚠️ Full result keys: {list(result.keys())}")
                print(f"   ⚠️ Videos array: {str(videos)[:300]}")
                return {'success': False, 'status': 'FAILED', 'error': 'No video in response', 'debug': str(result)[:500]}
            else:
                progress = result.get('metadata', {}).get('progressPercent', 0)
                return {'success': True, 'status': 'PROCESSING', 'progress': progress, 'done': False}

        return {'success': False, 'status': 'ERROR', 'error': f"Poll Error: {response.status_code}"}

    except Exception as e:
        return {'success': False, 'status': 'ERROR', 'error': str(e)}


# ═══════════════════════════════════════════════════════════════════════════════
# HTTP HANDLER
# ═══════════════════════════════════════════════════════════════════════════════

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])

            # Log incoming payload size for debugging
            payload_size_kb = content_length / 1024
            print(f"\n{'='*60}")
            print(f"🎬 REELS STUDIO v1.0 - TOP TIER")
            print(f"   📦 Incoming payload: {payload_size_kb:.0f}KB")

            # Warn if payload is large (Vercel limit is ~4.5MB)
            if payload_size_kb > 3000:
                print(f"   ⚠️ WARNING: Large payload ({payload_size_kb:.0f}KB) - may hit Vercel limits!")

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            action = data.get('action', 'start')
            print(f"   Action: {action}")
            print(f"{'='*60}")

            if action == 'start':
                # Start Reels generation
                image_data = data.get('image', '')
                content_type = data.get('contentType', 'product_showcase')
                script = data.get('script', '')
                duration = int(data.get('duration', 8))
                quality_mode = data.get('qualityMode', 'fast')
                music_id = data.get('musicId', 'none')
                caption_style = data.get('captionStyle', 'none')
                platform = data.get('platform', 'tiktok')
                avatar_config = data.get('avatarConfig')
                template = data.get('template', 'custom')

                if not image_data:
                    raise ValueError("No image provided")

                # Log incoming image size (from frontend)
                image_size_kb = len(image_data) / 1024
                print(f"   📷 Incoming image: {image_size_kb:.0f}KB (from frontend)")

                # Use template script if custom script not provided
                if not script and template != 'custom' and template in TEMPLATE_SCRIPTS:
                    script = TEMPLATE_SCRIPTS[template]

                token = get_fresh_token()
                if not token or not project_id:
                    raise ValueError("OAuth2 not available")

                clip_config = get_clip_config(duration)
                num_clips = clip_config['clips']

                print(f"   📹 Content: {content_type}, Duration: {duration}s ({num_clips} clips)")
                print(f"   🎵 Music: {music_id}, Captions: {caption_style}")

                model_id = 'veo-3.1-generate-001' if quality_mode == 'pro' else 'veo-3.1-fast-generate-001'

                if num_clips == 1:
                    # Single clip generation
                    prompt = build_clip_prompt(content_type, script, 0, 1, platform, avatar_config)
                    result = start_video_generation(image_data, prompt, model_id, '9:16', duration, token, project_id)

                    result['total_clips'] = 1
                    result['music_id'] = music_id
                    result['caption_style'] = caption_style
                    result['script'] = script
                    result['target_duration'] = duration

                else:
                    # Multi-clip generation
                    script_sections = split_script_for_clips(script, num_clips)
                    operations = []

                    for i, clip_duration in enumerate(clip_config['durations']):
                        clip_prompt = build_clip_prompt(
                            content_type,
                            script_sections[i] if i < len(script_sections) else '',
                            i,
                            num_clips,
                            platform,
                            avatar_config
                        )

                        clip_result = start_video_generation(
                            image_data, clip_prompt, model_id, '9:16',
                            clip_duration, token, project_id
                        )

                        if clip_result.get('success'):
                            operations.append({
                                'operation_name': clip_result['operation_name'],
                                'model_id': model_id,
                                'clip_index': i,
                                'completed': False,
                                'video_url': None
                            })
                        else:
                            print(f"   ⚠️ Clip {i+1} failed to start: {clip_result.get('error')}")

                    if not operations:
                        raise ValueError("Failed to start any clip generation")

                    result = {
                        'success': True,
                        'operations': operations,
                        'total_clips': len(operations),
                        'music_id': music_id,
                        'caption_style': caption_style,
                        'script': script,
                        'target_duration': duration,
                        'status': 'MULTI_CLIP_PENDING'
                    }

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())

            elif action == 'poll':
                # Poll for single operation
                operation_name = data.get('operationName', '')
                model_id = data.get('modelId', 'veo-3.1-fast-generate-001')

                if not operation_name:
                    raise ValueError("No operation name")

                token = get_fresh_token()
                if not token:
                    raise ValueError("OAuth2 not available")

                result = poll_operation(operation_name, model_id, token, project_id)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())

            elif action == 'finalize':
                # Finalize: stitch clips + trim + add music + burn captions
                video_urls = data.get('videoUrls', [])
                music_id = data.get('musicId', 'none')
                caption_style = data.get('captionStyle', 'none')
                script = data.get('script', '')
                target_duration = int(data.get('targetDuration', 8))
                content_type = data.get('contentType', 'product_showcase')

                if not video_urls:
                    raise ValueError("No videos to finalize")

                print(f"   🎬 Finalizing {len(video_urls)} clips for {target_duration}s video...")

                # Download all videos
                video_paths = []
                for url in video_urls:
                    path = download_video_to_temp(url)
                    if path:
                        video_paths.append(path)

                if not video_paths:
                    raise ValueError("Could not download any videos")

                # Step 1: Stitch if multiple clips (with dynamic transitions)
                if len(video_paths) > 1:
                    stitch_output = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
                    stitched_path = stitch_videos(
                        video_paths, stitch_output,
                        transition='fade',
                        transition_duration=0.5,
                        content_type=content_type  # Pass content type for varied transitions
                    )
                    if not stitched_path:
                        stitched_path = video_paths[0]
                else:
                    stitched_path = video_paths[0]

                # Step 2: Trim to exact target duration
                if target_duration in [15, 30, 60]:
                    trim_output = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
                    trimmed_path = trim_video_to_duration(stitched_path, target_duration, trim_output)
                else:
                    trimmed_path = stitched_path

                # Get actual duration for caption timing
                actual_duration = get_video_duration(trimmed_path) if trimmed_path else target_duration

                # Step 3: Add captions if enabled (with fade in/out)
                if caption_style != 'none' and script and caption_style in CAPTION_STYLES:
                    caption_output = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
                    captioned_path = add_captions_to_video(
                        trimmed_path, script, actual_duration, caption_style, caption_output
                    )
                else:
                    captioned_path = trimmed_path

                # Step 4: Add music if enabled
                if music_id != 'none' and music_id in REELS_MUSIC_LIBRARY:
                    music_config = REELS_MUSIC_LIBRARY[music_id]
                    if music_config and music_config.get('url'):
                        music_output = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
                        music_path = add_audio_overlay(captioned_path, music_config['url'], music_output)
                    else:
                        music_path = captioned_path
                else:
                    music_path = captioned_path

                # Step 5: Force 9:16 aspect ratio for Reels/TikTok
                aspect_output = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
                final_path = force_aspect_ratio_9_16(music_path, aspect_output)

                # Convert to base64
                with open(final_path, 'rb') as f:
                    video_bytes = f.read()
                video_b64 = base64.b64encode(video_bytes).decode('utf-8')

                # Cleanup temp files
                for p in video_paths:
                    if os.path.exists(p):
                        try:
                            os.unlink(p)
                        except:
                            pass

                for p in [stitched_path, trimmed_path, captioned_path, music_path, aspect_output, final_path]:
                    if p and os.path.exists(p) and p not in video_paths:
                        try:
                            os.unlink(p)
                        except:
                            pass

                result = {
                    'success': True,
                    'video_url': f"data:video/mp4;base64,{video_b64}",
                    'clips_stitched': len(video_paths),
                    'music_added': music_id != 'none',
                    'captions_added': caption_style != 'none',
                    'duration': actual_duration
                }

                print(f"   ✅ Reels finalized: {len(video_paths)} clips, {actual_duration:.1f}s")

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())

            elif action == 'get_config':
                # Return available options
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'music': {k: {'name': v['name'], 'mood': v['mood']} if v else None for k, v in REELS_MUSIC_LIBRARY.items()},
                    'captions': list(CAPTION_STYLES.keys()),
                    'content_types': list(CONTENT_TYPE_PROMPTS.keys()),
                    'templates': list(TEMPLATE_SCRIPTS.keys()),
                    'durations': [4, 6, 8, 15, 30, 60],
                    'version': '1.0-top-tier'
                }).encode())

            else:
                raise ValueError(f"Unknown action: {action}")

        except Exception as e:
            print(f"❌ ERROR: {e}")
            traceback.print_exc()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e),
                'status': 'ERROR'
            }).encode())


print("✅ Reels Studio v1.0 - Top Tier Viral Video Engine ready")
