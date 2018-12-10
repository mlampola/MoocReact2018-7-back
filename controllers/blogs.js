const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs.map(Blog.format))
})

blogsRouter.post('/', async (request, response) => {
  let blog = new Blog(request.body)

  try {
    if (!request.token) {
      return response.status(401).json({ error: 'token missing' })
    }

    const decodedToken = jwt.verify(request.token, process.env.BLOG_SECRET)

    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }

    if (blog.title === undefined) {
      return response.status(400).json({ error: 'title missing' })
    }

    if (blog.author === undefined) {
      return response.status(400).json({ error: 'author missing' })
    }

    if (blog.url === undefined) {
      return response.status(400).json({ error: 'url missing' })
    }

    if (blog.likes === undefined) {
      blog.likes = 0;
    }

    const user = await User.findById(decodedToken.id)

    blog.user = user._id
    const savedBlog = await blog.save()

    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.status(201).json(Blog.format(savedBlog))
  } catch (exception) {
    console.log(exception)
    response.status(500).json({ error: 'Blog: something went wrong in POST...' })
  }
})

blogsRouter.delete('/:id', async (request, response) => {
  const id = request.params.id

  try {
    if (!request.token) {
      return response.status(401).json({ error: 'token missing' })
    }

    const decodedToken = jwt.verify(request.token, process.env.BLOG_SECRET)

    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }

    const blog = await Blog.findById(id)

    if (blog === null) {
      return response.status(404).json({ error: 'blog not found' })
    }

    if (!blog.user || blog.user.toString() === decodedToken.id) {
      await Blog.findByIdAndRemove(id)
      response.status(204).end()
    } else {
      return response.status(401).json({ error: 'only own blogs can be deleted' })
    }
  } catch (exception) {
    console.log(exception)
    response.status(500).json({ error: 'Blog: something went wrong in DELETE...' })
  }
})

blogsRouter.put('/:id', async (request, response) => {
  const id = request.params.id
  const blog = request.body

  try {
    const savedBlog = await Blog
      .findByIdAndUpdate(id, blog, { new: true })
      .populate('user', { username: 1, name: 1 })
    response.json(Blog.format(savedBlog))
  } catch (error) {
    console.log(error)
    response.status(400).end()
  }
})

module.exports = blogsRouter