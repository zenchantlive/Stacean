#!/usr/bin/env bash
# Scan for all available skills and output a catalog

SKILLS_DIR="${1:-/home/clawdbot/clawd/skills}"

echo "=== Skill Scanner ==="
echo "Scanning: $SKILLS_DIR"
echo ""

for skill_path in "$SKILLS_DIR"/*/SKILL.md; do
    if [ -f "$skill_path" ]; then
        skill_name=$(basename $(dirname "$skill_path"))
        
        # Extract description from frontmatter
        description=$(grep -A 1 "^description:" "$skill_path" | tail -1 | sed 's/^  //' | tr -d '"')
        
        echo "📦 $skill_name"
        echo "   $description"
        echo ""
    fi
done

echo "=== Total Skills Found ==="
ls -1 "$SKILLS_DIR"/*/SKILL.md 2>/dev/null | wc -l
echo ""
echo "To use a skill, reference it by name in your prompt."
