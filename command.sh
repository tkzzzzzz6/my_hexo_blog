# test locally
hexo clean && hexo g && hexo s

hexo g && hexo s
# deploy to github pages
hexo clean && hexo g && hexo d

# create new post
hexo new "post title"
# create new page
hexo new page "page title"
# create new draft
hexo new draft "draft title"
# publish draft
hexo publish "draft title"
# unpublish post to draft
hexo unpublish "post title"
# delete post
hexo delete "post title"
# delete page
hexo delete page "page title"
# delete draft
hexo delete draft "draft title" 
# delete all drafts
hexo delete drafts