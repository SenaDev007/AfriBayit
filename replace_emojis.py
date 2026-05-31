#!/usr/bin/env python3
"""
Replace emoji characters with Lucide React icon components in AfriBayit source files.
Handles emojis in JSX text nodes and string literals differently.
"""
import os
import re

# Mapping of emoji → Lucide icon name
EMOJI_ICON_MAP = {
    # Buildings & Places
    '🏠': 'Home', '🏡': 'Home',
    '🏢': 'Building2',
    '🏗️': 'HardHat', '🏗': 'HardHat',
    '🏨': 'Hotel',
    '🏪': 'Store',
    '🏛️': 'Landmark', '🏛': 'Landmark',
    '🏖️': 'Umbrella', '🏖': 'Umbrella',
    '🏘️': 'Home', '🏘': 'Home',
    
    # Achievements & Badges
    '🏅': 'Award',
    '🏆': 'Trophy',
    '🥉': 'Medal',
    '🥈': 'Medal',
    '🥇': 'Medal',
    
    # Data & Documents
    '📊': 'BarChart3',
    '📈': 'TrendingUp',
    '📉': 'TrendingDown',
    '📋': 'ClipboardList',
    '📁': 'Folder',
    '📂': 'FolderOpen',
    '📅': 'Calendar',
    '📆': 'Calendar',
    '📝': 'FileText',
    '📄': 'FileText',
    '📜': 'ScrollText',
    '🗒️': 'NotepadText', '🗒': 'NotepadText',
    
    # Communication
    '📞': 'Phone',
    '📱': 'Smartphone',
    '📲': 'Smartphone',
    '📸': 'Camera',
    '💬': 'MessageCircle',
    '📧': 'Mail',
    '📥': 'Inbox',
    '📤': 'Send',
    
    # Security & Keys
    '🔍': 'Search',
    '🔎': 'Search',
    '🔑': 'Key',
    '🔒': 'Lock',
    '🔓': 'Unlock',
    
    # Tools
    '🔧': 'Wrench',
    '🔨': 'Hammer',
    '🛠️': 'Wrench', '🛠': 'Wrench',
    
    # Nature & Weather
    '🔥': 'Flame',
    '🌊': 'Waves',
    '🌍': 'Globe',
    '🌎': 'Globe',
    '🌏': 'Globe',
    '🌐': 'Globe2',
    '🌱': 'Sprout',
    '🌡️': 'Thermometer', '🌡': 'Thermometer',
    '🌧️': 'CloudRain', '🌧': 'CloudRain',
    '💧': 'Droplets',
    '🌬️': 'Wind', '🌬': 'Wind',
    '☀️': 'Sun', '☀': 'Sun',
    
    # Transport
    '🛣️': 'Route', '🛣': 'Route',
    '🚌': 'Bus',
    '🚕': 'Car',
    '✈️': 'Plane', '✈': 'Plane',
    '🛬': 'PlaneLanding',
    '🛫': 'PlaneTakeoff',
    '🚁': 'Copter',
    
    # Alerts & Status
    '⚠️': 'AlertTriangle', '⚠': 'AlertTriangle',
    '🚫': 'Ban',
    '🚨': 'Siren',
    '✅': 'CheckCircle',
    '❌': 'XCircle',
    '❓': 'HelpCircle',
    
    # Money & Finance
    '💰': 'Coins',
    '💵': 'Banknote',
    '💳': 'CreditCard',
    '💹': 'TrendingUp',
    '🧾': 'Receipt',
    '🧮': 'Calculator',
    
    # People
    '👤': 'User',
    '👥': 'Users',
    '👑': 'Crown',
    '🎭': 'Drama',  
    '🤖': 'Bot',
    '🤝': 'Handshake',
    '🙏': 'PrayingHands',
    
    # Objects & Misc
    '🎁': 'Gift',
    '🎉': 'PartyPopper',
    '🎓': 'GraduationCap',
    '💡': 'Lightbulb',
    '⚡': 'Zap',
    '🏷️': 'Tag', '🏷': 'Tag',
    '📍': 'MapPin',
    '🗺️': 'Map', '🗺': 'Map',
    '📐': 'Ruler',
    '📏': 'Ruler',
    '🥽': 'Goggles',
    '✍️': 'PenTool', '✍': 'PenTool',
    '✚': 'PlusCircle',
    '✨': 'Sparkles',
    '⏱': 'Timer',
    '⏳': 'Hourglass',
    '⏰': 'Clock',
    '🔔': 'Bell',
    'ℹ️': 'Info', 'ℹ': 'Info',
    '💎': 'Diamond',
    '💠': 'Diamond',
    '💜': 'Heart',
    '💜': 'Heart',
    '🆔': 'Badge',
    '📡': 'Radio',
    '🔄': 'RefreshCw',
    '⚖️': 'Scale', '⚖': 'Scale',
    '🛡️': 'Shield', '🛡': 'Shield',
    '🥐': 'Croissant',
    '🛏️': 'Bed', '🛏': 'Bed',
    '📎': 'Paperclip',
    
    # Check marks and crosses (non-emoji unicode)
    '✓': 'Check',
    '✕': 'X',
    '✗': 'X',
    '★': 'Star',
    '○': 'Circle',
    '●': 'Circle',
    
    # Arrows as icons (not CSS arrows)
    '↩️': 'Undo2', '↩': 'Undo2',
    '↗️': 'ExternalLink', '↗': 'ExternalLink',
    
    # Special
    '🇫🇷': 'FLAG_FR',  # Keep flag emojis as-is
    '🇬🇧': 'FLAG_GB',  # Keep flag emojis as-is
}

# Flag emojis to keep as-is
FLAG_INDICATORS = set(range(0x1F1E0, 0x1F1FF + 1))

def has_flag_emoji(s):
    """Check if string contains flag emoji characters."""
    for c in s:
        if ord(c) in FLAG_INDICATORS:
            return True
    return False

def is_only_flag_emoji(emoji_str):
    """Check if an emoji string is purely flag characters."""
    for c in emoji_str:
        cp = ord(c)
        if cp not in FLAG_INDICATORS and cp != 0x200D and cp not in range(0xFE00, 0xFE0F + 1):
            return False
    return True

def replace_emojis_in_file(filepath):
    """Replace emojis in a single file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    icons_needed = set()
    replacements = 0
    
    # Pattern to match emoji characters
    emoji_pattern = re.compile(
        '['
        '\U0001F300-\U0001F9FF'
        '\U00002600-\U000026FF'
        '\U00002700-\U000027BF'
        '\U0000FE00-\U0000FE0F'
        '\U0001F1E0-\U0001F1FF'
        '\U0000200D'
        '\U00002702-\U000027B0'
        '\U000024C2-\U0001F251'
        '\u2640-\u2642'
        '\u2600-\u2B55'
        '\u200d\u23cf\u23e9\u231a\ufe0f\u3030'
        ']+', flags=re.UNICODE
    )
    
    # Also match specific non-emoji unicode chars
    special_chars_pattern = re.compile('[✓✕✗★○●]')
    
    def replace_emoji(match):
        nonlocal replacements
        emoji = match.group()
        
        # Skip flag emojis - keep as-is
        if is_only_flag_emoji(emoji):
            return emoji
        
        # Look up in our map
        icon_name = EMOJI_ICON_MAP.get(emoji)
        if not icon_name:
            # Try without variation selector
            cleaned = emoji.replace('\ufe0f', '')
            icon_name = EMOJI_ICON_MAP.get(cleaned)
        
        if not icon_name:
            # Unknown emoji, remove it
            replacements += 1
            return ''
        
        if icon_name.startswith('FLAG_'):
            return emoji  # Keep flags
        
        icons_needed.add(icon_name)
        replacements += 1
        return f'<{icon_name} className="w-4 h-4" />'
    
    # Replace emojis
    content = emoji_pattern.sub(replace_emoji, content)
    content = special_chars_pattern.sub(
        lambda m: f'<{EMOJI_ICON_MAP.get(m.group(), "Circle")} className="w-4 h-4" />' if m.group() in EMOJI_ICON_MAP else m.group(),
        content
    )
    
    if content != original:
        # Add lucide-react imports if needed
        if icons_needed:
            # Check if lucide-react is already imported
            import_match = re.search(r"from\s+['\"]lucide-react['\"]", content)
            if import_match:
                # Find the import statement and add new icons
                import_line_match = re.search(r"import\s*\{([^}]+)\}\s*from\s+['\"]lucide-react['\"]", content)
                if import_line_match:
                    existing_icons = set(x.strip() for x in import_line_match.group(1).split(','))
                    all_icons = existing_icons | icons_needed
                    new_import = ', '.join(sorted(all_icons))
                    content = content[:import_line_match.start()] + \
                        f"import {{ {new_import} }} from 'lucide-react'" + \
                        content[import_line_match.end():]
            else:
                # Add new import after the last import
                import_lines = list(re.finditer(r"^import\s+.*$", content, re.MULTILINE))
                if import_lines:
                    last_import = import_lines[-1]
                    icons_str = ', '.join(sorted(icons_needed))
                    insert_pos = last_import.end()
                    content = content[:insert_pos] + \
                        f"\nimport {{ {icons_str} }} from 'lucide-react';" + \
                        content[insert_pos:]
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return replacements
        except PermissionError:
            # Try using temp file approach
            import tempfile, shutil
            tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.tsx', delete=False, encoding='utf-8')
            tmp.write(content)
            tmp.close()
            try:
                shutil.copy2(tmp.name, filepath)
                os.unlink(tmp.name)
                return replacements
            except (PermissionError, OSError):
                os.unlink(tmp.name)
                print(f'  SKIP (permission denied): {filepath}')
                return 0
    
    return 0

# Process all files
dirs = ['src/components/afribayit/', 'src/app/']
total_replacements = 0
files_modified = 0

for d in dirs:
    for root, dirs_list, files in os.walk(d):
        for f in files:
            if f.endswith(('.tsx', '.ts')):
                fpath = os.path.join(root, f)
                count = replace_emojis_in_file(fpath)
                if count > 0:
                    total_replacements += count
                    files_modified += 1
                    print(f'  {count:3d} replacements: {fpath}')

print(f'\nTotal: {total_replacements} emoji replacements across {files_modified} files')
