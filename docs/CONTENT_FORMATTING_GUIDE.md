# Postiz Agent CLI - Content Formatting Guide

Complete guide for creating posts with inline images, HTML content, embeds, and feature images.

---

## Table of Contents

1. [Uploading Media](#uploading-media)
2. [Ghost Posts](#ghost-posts)
   - [HTML Content](#ghost-html-content)
   - [Inline Images](#ghost-inline-images)
   - [Feature Images](#ghost-feature-images)
   - [Embeds](#ghost-embeds)
3. [LinkedIn Posts](#linkedin-posts)
   - [Text Content](#linkedin-text-content)
   - [Media Attachments](#linkedin-media-attachments)
4. [Using JSON Files](#using-json-files)
5. [Complete Examples](#complete-examples)

---

## Uploading Media

Before using images, upload them to Postiz:

```bash
# Upload an image
postiz upload ./my-image.jpg

# Output: {"url": "https://your-postiz-url/uploads/abc123-my-image.jpg", ...}
```

The returned URL can be used in `--media` flags or embedded in HTML content.

### Supported Formats

- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`
- **Videos**: `.mp4`, `.mov`, `.webm`, `.avi`
- **Audio**: `.mp3`, `.wav`, `.aac`

---

## Ghost Posts

### Ghost HTML Content

Ghost accepts full HTML content via `--content` or `--html`:

```bash
# Basic HTML content
postiz ghost:create -i ghost-123 \
  --title "My Article" \
  --content "<h2>Introduction</h2><p>This is the first paragraph.</p><h2>Main Content</h2><p>More content here.</p>"

# Full formatting
postiz ghost:create -i ghost-123 \
  --title "Formatted Article" \
  --content "
<h1>Main Heading</h1>

<h2>Section Heading</h2>

<p>This is a <strong>bold</strong> and <em>italic</em> text example.</p>

<blockquote>
  <p>This is a blockquote. Great for highlighting important information.</p>
</blockquote>

<ul>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ul>

<ol>
  <li>Numbered item one</li>
  <li>Numbered item two</li>
</ol>

<code>inline code example</code>

<pre><code>
// Code block
function hello() {
  console.log('Hello World');
}
</code></pre>
"
```

### Ghost Inline Images

Ghost uses standard HTML `<img>` tags for inline images:

```bash
# Upload the image first
postiz upload ./photo.jpg
# Returns: {"url": "https://postiz.url/uploads/photo.jpg"}

# Create post with inline image
postiz ghost:create -i ghost-123 \
  --title "Article with Images" \
  --content "
<h2>My Photo Gallery</h2>

<p>Here's my first photo:</p>

<img src='https://postiz.url/uploads/photo.jpg' alt='Photo description' />

<p>The photo above shows the sunset at the beach.</p>

<h2>Another Image</h2>

<img src='https://postiz.url/uploads/second-image.jpg' alt='Second photo' />

<p>And that wraps up our gallery!</p>
"
```

#### Image Sizing

```bash
# Control image size with inline styles
postiz ghost:create -i ghost-123 \
  --title "Sized Images" \
  --content "
<img src='https://postiz.url/uploads/large-image.jpg'
     alt='Large image'
     style='width: 100%; height: auto;' />

<img src='https://postiz.url/uploads/medium-image.jpg'
     alt='Medium image'
     style='max-width: 500px;' />

<img src='https://postiz.url/uploads/small-image.jpg'
     alt='Small image'
     width='300'
     height='200' />
"
```

#### Image Galleries with Captions

```bash
postiz ghost:create -i ghost-123 \
  --title "Photo Gallery" \
  --content "
<figure>
  <img src='https://postiz.url/uploads/photo1.jpg' alt='Photo 1'>
  <figcaption>Photo 1: Beautiful sunset at the beach</figcaption>
</figure>

<figure>
  <img src='https://postiz.url/uploads/photo2.jpg' alt='Photo 2'>
  <figcaption>Photo 2: Mountain view at dawn</figcaption>
</figure>
"
```

### Ghost Feature Images

Feature images appear at the top of posts and in social previews:

```bash
# Upload feature image
postiz upload ./hero-image.jpg
# Returns: https://postiz.url/uploads/hero-image.jpg

# Create post with feature image
postiz ghost:create -i ghost-123 \
  --title "Featured Article" \
  --content "<p>This article has a beautiful hero image.</p>" \
  --feature-image "https://postiz.url/uploads/hero-image.jpg" \
  --feature-image-caption "Photo by John Doe" \
  --feature-image-alt "Mountain landscape at sunset"
```

#### Full Article with Feature Image

```bash
postiz ghost:create -i ghost-123 \
  --title "Complete Article Example" \
  --content "
<p>This is the opening paragraph that appears after the feature image.</p>

<h2>Section One</h2>
<p>Content for section one...</p>

<h2>Section Two</h2>
<p>Content for section two with an inline image:</p>

<img src='https://postiz.url/uploads/inline-photo.jpg' alt='Inline photo'>

<h2>Conclusion</h2>
<p>Wrapping up the article...</p>
" \
  --feature-image "https://postiz.url/uploads/hero.jpg" \
  --feature-image-caption "Featured photo: Amazing sunset" \
  --feature-image-alt "Sunset over the ocean" \
  --visibility public \
  --tags "photography,travel,nature"
```

### Ghost Embeds

Ghost supports embeds through HTML cards. Here are common patterns:

#### YouTube Embed

```bash
postiz ghost:create -i ghost-123 \
  --title "Video Tutorial" \
  --content "
<h2>Watch the Tutorial</h2>

<!-- YouTube embed -->
<iframe
  width='560'
  height='315'
  src='https://www.youtube.com/embed/VIDEO_ID'
  frameborder='0'
  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
  allowfullscreen>
</iframe>

<p>Don't forget to subscribe!</p>
"
```

#### Twitter/X Embed

```bash
postiz ghost:create -i ghost-123 \
  --title "Twitter Roundup" \
  --content "
<h2>Trending Tweet</h2>

<!-- Twitter embed via blockquote -->
<blockquote class='twitter-tweet'>
  <a href='https://twitter.com/user/status/TWEET_ID'>View Tweet</a>
</blockquote>
<script async src='https://platform.twitter.com/widgets.js' charset='utf-8'></script>

<p>What do you think about this?</p>
"
```

#### Spotify Embed

```bash
postiz ghost:create -i ghost-123 \
  --title "Music Recommendations" \
  --content "
<h2>My Playlist</h2>

<!-- Spotify embed -->
<iframe
  style='border-radius:12px'
  src='https://open.spotify.com/embed/playlist/PLAYLIST_ID?utm_source=generator'
  width='100%'
  height='352'
  frameBorder='0'
  allowfullscreen=''
  allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'
  loading='lazy'>
</iframe>
"
```

#### CodePen Embed

```bash
postiz ghost:create -i ghost-123 \
  --title "Code Example" \
  --content "
<h2>Interactive Demo</h2>

<p>Check out this CodePen:</p>

<iframe
  height='400'
  style='width: 100%;'
  scrolling='no'
  title='CodePen Example'
  src='https://codepen.io/USER/embed/PEN_ID?default-tab=html%2Cresult'
  frameborder='no'
  loading='lazy'
  allowtransparency='true'
  allowfullscreen='true'>
</iframe>
"
```

#### GitHub Gist Embed

```bash
postiz ghost:create -i ghost-123 \
  --title "Code Snippet" \
  --content "
<h2>Example Code</h2>

<script src='https://gist.github.com/USER/GIST_ID.js'></script>

<p>Feel free to use this code in your projects.</p>
"
```

---

## LinkedIn Posts

### LinkedIn Text Content

```bash
# Simple text post
postiz posts:create \
  --content "Excited to share that we've just launched our new product! 🚀 #startup #innovation" \
  --integrations "linkedin-123" \
  --date "2024-12-25T10:00:00Z"

# Longer post with formatting
postiz posts:create \
  --content "Big announcement!

We've been working on something special for the past year, and today we're finally ready to share it with you.

Here's what makes it unique:
• Feature 1: Description
• Feature 2: Description
• Feature 3: Description

Check out the link in comments for more details! 👇" \
  --integrations "linkedin-123" \
  --date "2024-12-25T10:00:00Z"
```

### LinkedIn Media Attachments

```bash
# Upload images first
postiz upload ./product-photo.jpg
# Returns: https://postiz.url/uploads/product-photo.jpg

# Single image post
postiz posts:create \
  --content "Check out our new product! 🎉" \
  --media "https://postiz.url/uploads/product-photo.jpg" \
  --integrations "linkedin-123" \
  --date "2024-12-25T10:00:00Z"

# Multiple images (carousel) - at least 2 images required
postiz posts:create \
  --content "Product launch - swipe to see all features! 👇" \
  --media "https://postiz.url/uploads/img1.jpg,https://postiz.url/uploads/img2.jpg,https://postiz.url/uploads/img3.jpg" \
  --integrations "linkedin-123" \
  --date "2024-12-25T10:00:00Z"

# Video post
postiz upload ./demo-video.mp4
# Returns: https://postiz.url/uploads/demo-video.mp4

postiz posts:create \
  --content "Watch our 30-second demo! 🎬" \
  --media "https://postiz.url/uploads/demo-video.mp4" \
  --integrations "linkedin-123" \
  --date "2024-12-25T10:00:00Z"
```

### LinkedIn Carousel Posts (PDF)

LinkedIn supports carousels in two ways:

#### 1. Image Carousel (2+ Images)

When you provide multiple images, LinkedIn creates a swipeable carousel:

```bash
# Upload all images
postiz upload ./slide1.jpg
postiz upload ./slide2.jpg
postiz upload ./slide3.jpg
postiz upload ./slide4.jpg

# Create carousel post
postiz posts:create \
  --content "Swipe through our product features! 👇" \
  --media "https://postiz.url/uploads/slide1.jpg,https://postiz.url/uploads/slide2.jpg,https://postiz.url/uploads/slide3.jpg,https://postiz.url/uploads/slide4.jpg" \
  --integrations "linkedin-123" \
  --date "2024-12-25T10:00:00Z"
```

#### 2. PDF Document Upload

Upload a PDF directly for LinkedIn documents:

```bash
# Upload PDF
postiz upload ./presentation.pdf
# Returns: https://postiz.url/uploads/presentation.pdf

# Create PDF post
postiz posts:create \
  --content "Check out our latest presentation! 📊" \
  --media "https://postiz.url/uploads/presentation.pdf" \
  --integrations "linkedin-123" \
  --date "2024-12-25T10:00:00Z"
```

#### 3. Convert Images to PDF Carousel

Use the `--settings` flag to convert images into a PDF carousel:

```bash
# Upload slide images
postiz upload ./slide1.jpg
postiz upload ./slide2.jpg
postiz upload ./slide3.jpg

# Convert images to PDF carousel with custom title
postiz posts:create \
  --content "Our Q4 Results - Swipe through! 📈" \
  --media "https://postiz.url/uploads/slide1.jpg,https://postiz.url/uploads/slide2.jpg,https://postiz.url/uploads/slide3.jpg" \
  --settings '{"post_as_images_carousel":true,"carousel_name":"Q4 Results Presentation"}' \
  --integrations "linkedin-123" \
  --date "2024-12-25T10:00:00Z"
```

**Settings options:**

| Setting | Type | Description |
|---------|------|-------------|
| `post_as_images_carousel` | boolean | Convert images to PDF carousel |
| `carousel_name` | string | Title for the PDF document (default: "slides") |

**Note:** Carousels require at least 2 images. Videos can only be posted individually (not in carousels).

---

## Using JSON Files

For complex posts, use JSON files:

### Basic JSON Structure

```json
{
  "type": "schedule",
  "date": "2024-12-25T10:00:00Z",
  "shortLink": true,
  "tags": ["featured", "announcement"],
  "posts": [
    {
      "integration": { "id": "ghost-123" },
      "value": [
        {
          "content": "<h1>Hello World</h1><p>Content here...</p>",
          "image": [],
          "delay": 0
        }
      ],
      "settings": {
        "title": "My Article",
        "visibility": "public",
        "tags": ["technology", "news"]
      }
    }
  ]
}
```

### Complex JSON with Multiple Platforms

```json
{
  "type": "schedule",
  "date": "2024-12-25T10:00:00Z",
  "shortLink": true,
  "tags": [],
  "posts": [
    {
      "integration": { "id": "ghost-123" },
      "value": [
        {
          "content": "<h1>Big Announcement</h1><p>We're launching something new!</p><img src='https://postiz.url/uploads/hero.jpg' alt='Hero'><p>Read more about it...</p>",
          "image": [],
          "delay": 0
        }
      ],
      "settings": {
        "__type": "ghost",
        "title": "Big Announcement - Product Launch",
        "visibility": "public",
        "feature_image": "https://postiz.url/uploads/hero.jpg",
        "feature_image_caption": "Our new product",
        "tags": ["announcement", "product"]
      }
    },
    {
      "integration": { "id": "linkedin-123" },
      "value": [
        {
          "content": "Big announcement! 🚀 We're launching something new. Check out our blog for the full story! #product #launch",
          "image": ["https://postiz.url/uploads/hero.jpg"],
          "delay": 0
        }
      ],
      "settings": {}
    }
  ]
}
```

### Create from JSON File

```bash
# Save the JSON to a file
cat > my-post.json << 'EOF'
{
  "type": "schedule",
  "date": "2024-12-25T10:00:00Z",
  "posts": [
    {
      "integration": { "id": "ghost-123" },
      "value": [
        {
          "content": "<h1>My Article</h1><img src='https://postiz.url/uploads/photo.jpg'><p>Content...</p>"
        }
      ],
      "settings": {
        "title": "My Article",
        "feature_image": "https://postiz.url/uploads/photo.jpg"
      }
    }
  ]
}
EOF

# Create from JSON file
postiz posts:create --json my-post.json
```

---

## Complete Examples

### Blog Post with Images and Embed

```bash
# Upload all images first
postiz upload ./hero.jpg
# https://postiz.url/uploads/hero.jpg

postiz upload ./diagram.png
# https://postiz.url/uploads/diagram.png

postiz upload ./screenshot.jpg
# https://postiz.url/uploads/screenshot.jpg

# Create the post
postiz ghost:create -i ghost-123 \
  --title "Building a Scalable Architecture" \
  --content "
<h2>Introduction</h2>
<p>In this article, I'll walk you through building a scalable architecture...</p>

<img src='https://postiz.url/uploads/hero.jpg' alt='Architecture Overview' style='width: 100%;'>

<h2>The Problem</h2>
<p>When your application grows, you need to think about...</p>

<figure>
  <img src='https://postiz.url/uploads/diagram.png' alt='System Diagram'>
  <figcaption>Figure 1: High-level system architecture</figcaption>
</figure>

<h2>The Solution</h2>
<p>Here's how we solved it...</p>

<img src='https://postiz.url/uploads/screenshot.jpg' alt='Implementation Screenshot'>

<h2>Video Walkthrough</h2>
<p>Watch the full walkthrough:</p>

<iframe
  width='560'
  height='315'
  src='https://www.youtube.com/embed/dQw4w9WgXcQ'
  frameborder='0'
  allowfullscreen>
</iframe>

<h2>Conclusion</h2>
<p>And that's how you build a scalable architecture!</p>

<blockquote>
  <p>Have questions? Leave a comment below!</p>
</blockquote>
" \
  --feature-image "https://postiz.url/uploads/hero.jpg" \
  --feature-image-caption "Architecture diagram showing the full system" \
  --tags "architecture,scalability,engineering" \
  --visibility public
```

### Product Announcement (Cross-Platform)

```bash
# Upload product images
postiz upload ./product-hero.jpg
postiz upload ./product-feature-1.jpg
postiz upload ./product-feature-2.jpg
postiz upload ./product-feature-3.jpg

# Create Ghost blog post
postiz ghost:create -i ghost-123 \
  --title "Introducing Our New Product" \
  --content "
<h2>The Problem We're Solving</h2>
<p>For years, teams have struggled with...</p>

<h2>Our Solution</h2>
<p>Today, we're excited to announce...</p>

<img src='https://postiz.url/uploads/product-hero.jpg' alt='Product Hero'>

<h2>Key Features</h2>

<h3>Feature One</h3>
<img src='https://postiz.url/uploads/product-feature-1.jpg' alt='Feature 1'>
<p>Description of feature one...</p>

<h3>Feature Two</h3>
<img src='https://postiz.url/uploads/product-feature-2.jpg' alt='Feature 2'>
<p>Description of feature two...</p>

<h3>Feature Three</h3>
<img src='https://postiz.url/uploads/product-feature-3.jpg' alt='Feature 3'>
<p>Description of feature three...</p>

<h2>Get Started Today</h2>
<p>Sign up now and get 30 days free!</p>
" \
  --feature-image "https://postiz.url/uploads/product-hero.jpg" \
  --visibility public \
  --tags "product,announcement,launch"

# Create LinkedIn post
postiz posts:create \
  --content "🚀 BIG NEWS!

We're thrilled to announce our new product!

✨ Feature 1: Description
✨ Feature 2: Description
✨ Feature 3: Description

Read the full announcement: [link in comments]

#product #launch #innovation" \
  --media "https://postiz.url/uploads/product-hero.jpg" \
  --integrations "linkedin-123" \
  --date "2024-12-25T10:00:00Z"
```

### Newsletter with Embedded Content

```bash
postiz ghost:create -i ghost-123 \
  --title "Weekly Newsletter #42" \
  --content "
<h2>👋 Hello Everyone!</h2>

<p>Here's what happened this week...</p>

<h2>📰 Top Stories</h2>

<h3>Story One</h3>
<p>Brief summary of the story...</p>
<a href='https://example.com/story1'>Read more →</a>

<h3>Story Two</h3>
<p>Another interesting development...</p>
<a href='https://example.com/story2'>Read more →</a>

<h2>🎥 Video of the Week</h2>

<iframe
  width='560'
  height='315'
  src='https://www.youtube.com/embed/VIDEO_ID'
  frameborder='0'
  allowfullscreen>
</iframe>

<h2>🎵 Music Recommendation</h2>

<iframe
  style='border-radius:12px'
  src='https://open.spotify.com/embed/track/TRACK_ID'
  width='100%'
  height='152'
  frameborder='0'>
</iframe>

<h2>💡 Tip of the Week</h2>
<p>Here's a quick productivity tip...</p>

<h2>Until Next Week!</h2>
<p>Thanks for reading. See you next Sunday!</p>
" \
  --newsletter-id "newsletter_abc123" \
  --visibility members \
  --tags "newsletter,weekly"
```

---

## Tips and Best Practices

### Image Optimization

```bash
# Resize images before uploading (optional but recommended)
# Using ImageMagick:
convert large-image.jpg -resize 1200x800 optimized-image.jpg

# Upload the optimized version
postiz upload ./optimized-image.jpg
```

### HTML Best Practices

1. **Use semantic HTML**: `<h1>`, `<h2>`, `<h3>`, `<p>`, `<ul>`, `<blockquote>`
2. **Add alt text**: Always include `alt` attributes on images
3. **Keep it responsive**: Use `width: 100%` or `max-width` for images
4. **Test embeds**: Make sure your embeds work in the Ghost preview

### Batch Posting

```bash
# Create a script to batch upload images
for img in ./images/*.jpg; do
  postiz upload "$img"
done

# Then use the URLs in your posts
```

### Environment Variables for Reusability

```bash
# Set common variables
export GHOST_ID="ghost-abc123"
export LINKEDIN_ID="linkedin-xyz789"
export API_URL="https://api.postiz.com"

# Use in commands
postiz ghost:create -i $GHOST_ID --title "Test" --content "<p>Test</p>"
postiz posts:create -i $LINKEDIN_ID --content "Test post"
```

---

## Troubleshooting

### Image Not Displaying

1. Verify the URL is correct
2. Ensure the image was uploaded successfully
3. Check if the image is publicly accessible

```bash
# Test image accessibility
curl -I https://postiz.url/uploads/your-image.jpg
```

### Embed Not Working

1. Check if the platform supports the embed type
2. Ensure the embed code is correct
3. Test in Ghost preview before publishing

### JSON Parsing Errors

```bash
# Validate JSON before using
cat my-post.json | jq .
```

### Rate Limiting

If you hit rate limits, add delays between posts:

```bash
# Create posts with delays
for post in posts/*.json; do
  postiz posts:create --json "$post"
  sleep 60  # Wait 60 seconds between posts
done
```