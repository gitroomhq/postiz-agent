# Postiz Agent CLI - Ghost & LinkedIn Integration Guide

This guide covers using the `postiz-agent` CLI to manage content on **Ghost CMS** and **LinkedIn** through the Postiz platform.

## Prerequisites

```bash
# Set your Postiz API key
export POSTIZ_API_KEY=your_api_key

# Optional: Set custom API URL (default: https://api.postiz.com)
export POSTIZ_API_URL=https://your-api-url/api
```

## Get Your Integration IDs

First, list your connected integrations to get the integration IDs:

```bash
postiz integrations:list
```

Example output:
```
Connected Integrations:
  - Ghost Blog: ghost-abc123
  - LinkedIn: linkedin-xyz789
  - Twitter: twitter-def456
```

---

# Ghost CMS Commands

Ghost has dedicated commands because it's a full CMS with additional features like scheduling, tags, authors, etc.

## Creating Posts

### Create and Publish Immediately

```bash
postiz ghost:create -i ghost-abc123 \
  --title "My First Post" \
  --content "<p>Hello from Postiz CLI!</p>"
```

### Create a Draft

```bash
postiz ghost:create -i ghost-abc123 \
  --title "Work in Progress" \
  --content "<p>Draft content...</p>" \
  --draft
```

### Schedule for Future Publication

```bash
postiz ghost:create -i ghost-abc123 \
  --title "Scheduled Post" \
  --content "<p>Will be published later</p>" \
  --schedule \
  --date "2024-12-31T10:00:00Z"
```

> **Native Scheduling:** Ghost posts scheduled through Postiz appear immediately in your Ghost dashboard with `scheduled` status. Ghost handles the actual publishing at the scheduled time.

### Create Member-Only Content

```bash
postiz ghost:create -i ghost-abc123 \
  --title "Exclusive Content" \
  --content "<p>Members only content here</p>" \
  --visibility members
```

### Create Paid Content

```bash
postiz ghost:create -i ghost-abc123 \
  --title "Premium Article" \
  --content "<p>Paid subscriber content</p>" \
  --visibility paid \
  --tiers "tier_abc,tier_xyz"
```

### Create with Tags and Authors

```bash
postiz ghost:create -i ghost-abc123 \
  --title "Tech News" \
  --content "<p>Latest updates...</p>" \
  --tags "technology,news,updates" \
  --authors "author_id_1,author_id_2"
```

### Create with Feature Image

```bash
postiz ghost:create -i ghost-abc123 \
  --title "Featured Article" \
  --content "<p>Content here...</p>" \
  --feature-image "https://example.com/image.jpg" \
  --feature-image-caption "Photo by Author" \
  --feature-image-alt "Description of image"
```

### Create with SEO Settings

```bash
postiz ghost:create -i ghost-abc123 \
  --title "SEO Optimized Post" \
  --content "<p>Content...</p>" \
  --meta-title "Custom Meta Title" \
  --meta-description "SEO description for search engines" \
  --canonical-url "https://original-source.com/article"
```

## Managing Posts

### List Ghost Posts

```bash
# List recent posts
postiz ghost:posts ghost-abc123

# List with limit
postiz ghost:posts ghost-abc123 --limit 50

# Filter by status
postiz ghost:posts ghost-abc123 --status draft
postiz ghost:posts ghost-abc123 --status published
postiz ghost:posts ghost-abc123 --status scheduled
```

### Check Post Status

```bash
postiz ghost:status ghost-abc123 64a1b2c3d4e5f6
```

### Change Post Status

```bash
# Publish a draft
postiz ghost:publish ghost-abc123 64a1b2c3d4e5f6

# Unpublish (revert to draft)
postiz ghost:unpublish ghost-abc123 64a1b2c3d4e5f6

# Schedule for future
postiz ghost:schedule ghost-abc123 64a1b2c3d4e5f6 --published-at "2024-12-31T10:00:00Z"
```

### Update a Post

```bash
postiz ghost:update postiz-post-123 \
  --integration-id ghost-abc123 \
  --title "Updated Title" \
  --content "<p>Updated content...</p>" \
  --visibility members
```

### Delete a Post

```bash
# Deletes from both Postiz and Ghost
postiz ghost:delete postiz-post-123
```

## Ghost Metadata Commands

### List Tags

```bash
postiz ghost:tags ghost-abc123
```

### List Authors

```bash
postiz ghost:authors ghost-abc123
```

### List Membership Tiers

```bash
postiz ghost:tiers ghost-abc123
```

### List Newsletters

```bash
postiz ghost:newsletters ghost-abc123
```

## Cleanup Commands

### List Draft Posts (for cleanup)

```bash
# List all drafts
postiz ghost:drafts ghost-abc123

# List drafts older than 24 hours
postiz ghost:drafts ghost-abc123 --older-than 24
```

### Clean Up Orphaned Drafts

```bash
# Preview what would be deleted
postiz ghost:cleanup ghost-abc123 --dry-run

# Delete drafts older than 48 hours
postiz ghost:cleanup ghost-abc123 --older-than 48
```

## Theme Commands

### Get Theme Settings

```bash
postiz ghost:theme ghost-abc123
```

---

# LinkedIn Commands

LinkedIn uses the standard `posts:create` command since it's a social media platform.

## Creating LinkedIn Posts

### Simple Text Post

```bash
postiz posts:create \
  --content "Excited to share my latest project! #tech #innovation" \
  --integrations "linkedin-xyz789" \
  --date "2024-12-25T10:00:00Z" \
  --type schedule
```

### Post with Image

```bash
# First upload the image
postiz upload ./my-image.jpg

# Then create the post with the image URL
postiz posts:create \
  --content "Check out this amazing view! 📸" \
  --media "https://your-postiz-url/uploads/my-image.jpg" \
  --integrations "linkedin-xyz789" \
  --date "2024-12-25T10:00:00Z" \
  --type schedule
```

### Post with Multiple Images

```bash
postiz posts:create \
  --content "Project gallery - swipe to see more! 👇" \
  --media "https://postiz.url/img1.jpg,https://postiz.url/img2.jpg,https://postiz.url/img3.jpg" \
  --integrations "linkedin-xyz789" \
  --date "2024-12-25T10:00:00Z" \
  --type schedule
```

### Create a Draft

```bash
postiz posts:create \
  --content "Work in progress..." \
  --integrations "linkedin-xyz789" \
  --date "2024-12-25T10:00:00Z" \
  --type draft
```

### Post Immediately (No Scheduling)

```bash
postiz posts:create \
  --content "Live from the conference! 🎤" \
  --integrations "linkedin-xyz789" \
  --date "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --type schedule
```

## LinkedIn Article (Long-form Content)

```bash
# Create a long article
postiz posts:create \
  --content "<h1>The Future of AI</h1><p>Long form content here...</p><h2>Key Points</h2><ul><li>Point 1</li><li>Point 2</li></ul>" \
  --integrations "linkedin-xyz789" \
  --date "2024-12-25T10:00:00Z" \
  --type schedule
```

## Managing LinkedIn Posts

### List All Posts

```bash
postiz posts:list
```

### Filter by Date Range

```bash
postiz posts:list \
  --startDate "2024-01-01T00:00:00Z" \
  --endDate "2024-12-31T23:59:59Z"
```

### Delete a Post

```bash
postiz posts:delete post-id-123
```

### Reschedule a Post

```bash
postiz posts:reschedule post-id-123 \
  --date "2024-12-30T15:00:00Z"
```

## LinkedIn-Specific Settings

LinkedIn uses the `--settings` flag for platform-specific options:

```bash
postiz posts:create \
  --content "What do you think about this?" \
  --integrations "linkedin-xyz789" \
  --date "2024-12-25T10:00:00Z" \
  --settings '{"visibility":"PUBLIC"}'
```

---

# Cross-Platform Posting

Post to multiple platforms simultaneously:

```bash
# Post to both LinkedIn and Ghost
postiz posts:create \
  --content "Exciting announcement coming soon!" \
  --integrations "linkedin-xyz789,ghost-abc123" \
  --date "2024-12-25T10:00:00Z" \
  --type schedule
```

> **Note:** Each platform handles content differently. Ghost expects HTML content, while LinkedIn accepts plain text or HTML. The CLI handles basic conversions, but for best results, create platform-specific content.

---

# Post History

The CLI keeps a local history of posts created:

```bash
# View history
postiz posts:history

# Filter by provider
postiz posts:history --provider ghost

# Filter by status
postiz posts:history --status scheduled

# Output as JSON
postiz posts:history --json

# Get specific post details
postiz posts:get post-id-123

# Clear history
postiz posts:clear-history --confirm
```

---

# Analytics

## Platform Analytics

```bash
# Get analytics for LinkedIn integration
postiz analytics:platform linkedin-xyz789 --date 7

# Get analytics for Ghost integration
postiz analytics:platform ghost-abc123 --date 30
```

## Post Analytics

```bash
postiz analytics:post post-id-123 --date 7
```

---

# Integration Settings

## Get Settings Schema

```bash
postiz integrations:settings linkedin-xyz789
postiz integrations:settings ghost-abc123
```

## Trigger Integration Tools

```bash
# Get available tools for an integration
postiz integrations:trigger integration-id --method listPosts

# Example: Get Ghost tags
postiz integrations:trigger ghost-abc123 tags

# Example: Create Ghost preview
postiz integrations:trigger ghost-abc123 preview \
  -d '{"title":"Test","html":"<p>Content</p>"}'
```

---

# Troubleshooting

## Common Issues

### Authentication Errors

```bash
# Ensure API key is set
echo $POSTIZ_API_KEY

# Verify API key is valid
postiz integrations:list
```

### Integration Not Found

```bash
# List available integrations
postiz integrations:list

# Use the correct integration ID format: provider-id
# Example: ghost-abc123, linkedin-xyz789
```

### Post Not Appearing in Ghost

1. Check the post status:
   ```bash
   postiz ghost:status ghost-abc123 <post-id>
   ```

2. For scheduled posts, verify the date:
   ```bash
   postiz posts:list --startDate "2024-01-01T00:00:00Z"
   ```

### Ghost Draft Cleanup

If you have orphaned preview drafts:
```bash
postiz ghost:cleanup ghost-abc123 --older-than 24 --dry-run
```

---

# Examples

## Complete Workflow: Blog Post

```bash
# 1. Create a scheduled Ghost post
postiz ghost:create -i ghost-abc123 \
  --title "10 Tips for Better Productivity" \
  --content "<h2>Introduction</h2><p>Productivity is essential...</p><h2>Tip 1: Plan Your Day</h2><p>Start with...</p>" \
  --tags "productivity,tips,business" \
  --feature-image "https://images.unsplash.com/photo-xxx" \
  --visibility members \
  --schedule \
  --date "2024-12-25T09:00:00Z"

# 2. Create a LinkedIn announcement
postiz posts:create \
  --content "📖 New blog post: '10 Tips for Better Productivity' - Members get exclusive early access! #productivity #tips" \
  --integrations "linkedin-xyz789" \
  --date "2024-12-25T09:05:00Z" \
  --type schedule

# 3. Verify both posts are scheduled
postiz posts:list --status scheduled
```

## Complete Workflow: Company Announcement

```bash
# 1. Create Ghost announcement
postiz ghost:create -i ghost-abc123 \
  --title "Company Update: New Product Launch" \
  --content "<p>We're excited to announce...</p>" \
  --tags "news,announcement" \
  --visibility public \
  --schedule \
  --date "2024-12-25T14:00:00Z"

# 2. Create LinkedIn post
postiz posts:create \
  --content "🚀 Big news! We're launching something new. Read the full announcement on our blog. #startup #innovation" \
  --integrations "linkedin-xyz789" \
  --date "2024-12-25T14:00:00Z" \
  --type schedule
```

---

# Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTIZ_API_KEY` | Your Postiz API key | Required |
| `POSTIZ_API_URL` | Custom API URL | `https://api.postiz.com` |
| `POSTIZ_HISTORY_FILE` | Path to history file | `~/.postiz/history.json` |

---

# Need Help?

```bash
# Get help for any command
postiz --help
postiz posts:create --help
postiz ghost:create --help
```

For more information, visit: https://postiz.com