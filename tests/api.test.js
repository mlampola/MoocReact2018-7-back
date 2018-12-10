const supertest = require('supertest')
const { app, server } = require('../index')
const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')
const { initialBlogs, blogsInDb, usersInDb } = require('./test_helper')

beforeAll(async () => {
  await Blog.remove({})
  const blogs = initialBlogs.map(blog => new Blog(blog))
  await Promise.all(blogs.map(blog => blog.save()))

  await User.remove({})
  const user = new User({ username: 'root', password: 'sekret' })
  await user.save()
})

describe('blog API - GET', () => {
  test('all blogs are returned as json', async () => {
    const blogsInDatabase = await blogsInDb()

    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(response.body.length).toBe(blogsInDatabase.length)

    const titles = response.body.map(blog => blog.title)
    blogsInDatabase.forEach(blog => expect(titles).toContain(blog.title))
  })
})

describe('blog API - POST', () => {

  test('a valid blog can be added ', async () => {
    const blogsAtStart = await blogsInDb()

    const newBlog = {
      title: 'How to post blogs',
      author: "Markus Lampola",
      url: "http://google.com/",
      likes: 0
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAfterOperation = await blogsInDb()

    expect(blogsAfterOperation.length).toBe(blogsAtStart.length + 1)

    const titles = blogsAfterOperation.map(r => r.title)
    expect(titles).toContain(newBlog.title)
  })

  test('blog without title is not added ', async () => {
    const blogsAtStart = await blogsInDb()

    const newBlog = {
      author: "Markus Lampola",
      url: "http://google.com/",
      likes: 0
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)

    const blogsAfterOperation = await blogsInDb()

    expect(blogsAfterOperation.length).toBe(blogsAtStart.length)
  })

  test('blog without author is not added ', async () => {
    const blogsAtStart = await blogsInDb()

    const newBlog = {
      title: 'How to post blogs',
      url: "http://google.com/",
      likes: 0
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)

    const blogsAfterOperation = await blogsInDb()

    expect(blogsAfterOperation.length).toBe(blogsAtStart.length)
  })

  test('blog without url is not added ', async () => {
    const blogsAtStart = await blogsInDb()

    const newBlog = {
      title: 'How to post blogs',
      author: "Markus Lampola",
      likes: 0
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)

    const blogsAfterOperation = await blogsInDb()

    expect(blogsAfterOperation.length).toBe(blogsAtStart.length)
  })
})

describe('posting a blog without likes', () => {
  test('the blog can be added and likes is initialized', async () => {
    const blogsAtStart = await blogsInDb()

    const newBlog = {
      title: 'How to post blogs, part 2',
      author: "Markus Lampola",
      url: "http://google.com/",
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAfterOperation = await blogsInDb()

    expect(blogsAfterOperation.length).toBe(blogsAtStart.length + 1)

    const titles = blogsAfterOperation.map(blog => blog.title)
    expect(titles).toContain(newBlog.title)

    expect(blogsAfterOperation.find(b => b.title === newBlog.title).likes).toBe(0)
  })
})

describe('blog API - DELETE', () => {
  test('the blog can be deleted', async () => {
    const blogsAtStart = await blogsInDb()
    const blogToBeDeleted = blogsAtStart[blogsAtStart.length - 1]

    await api
      .delete(`/api/blogs/${blogToBeDeleted.id}`)
      .expect(204)

    const blogsAfterOperation = await blogsInDb()
    expect(blogsAfterOperation.length).toBe(blogsAtStart.length - 1)

    const titles = blogsAfterOperation.map(blog => blog.title)
    expect(titles).not.toContain(blogToBeDeleted.title)
  })
})

describe('blog API - UPDATE', () => {
  test('the blog can be updated', async () => {
    const blogsAtStart = await blogsInDb()
    const blogToBeUpdated = blogsAtStart[0]
    const likesAtStart = blogToBeUpdated.likes
    console.log(likesAtStart)
    ++blogToBeUpdated.likes
    console.log(likesAtStart)

    await api
      .put(`/api/blogs/${blogToBeUpdated.id}`)
      .send(blogToBeUpdated)
      .expect(200)

    const blogsAfterOperation = await blogsInDb()
    const updatedBlog = blogsAfterOperation[0]
    expect(blogsAfterOperation.length).toBe(blogsAtStart.length)
    expect(updatedBlog.likes).toBe(likesAtStart + 1)
  })
})

describe('user API', async () => {
  test('POST /api/users succeeds with a fresh username', async () => {
    const usersBeforeOperation = await usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      adult: true,
      password: 'salainen'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAfterOperation = await usersInDb()
    expect(usersAfterOperation.length).toBe(usersBeforeOperation.length + 1)
    const usernames = usersAfterOperation.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('all users are returned as json', async () => {
    const usersInDatabase = await usersInDb()

    const response = await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(response.body.length).toBe(usersInDatabase.length)

    const usernames = response.body.map(user => user.username)
    usersInDatabase.forEach(user => expect(usernames).toContain(user.username))
  })
})

describe('user API - validation', async () => {
  test('POST /api/users fails with proper statuscode and message if username already taken', async () => {
    const usersBeforeOperation = await usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body).toEqual({ error: 'username must be unique' })

    const usersAfterOperation = await usersInDb()
    expect(usersAfterOperation.length).toBe(usersBeforeOperation.length)
  })

  test('POST /api/users fails with proper statuscode and message if password is too short', async () => {
    const usersBeforeOperation = await usersInDb()

    const newUser = {
      username: 'mlampola',
      name: 'Markus Lampola',
      password: 'sa'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body).toEqual({ error: 'password must contain at least 3 characters' })

    const usersAfterOperation = await usersInDb()
    expect(usersAfterOperation.length).toBe(usersBeforeOperation.length)
  })

  test('the user can be added and adult is initialized', async () => {
    const usersBeforeOperation = await usersInDb()

    const newUser = {
      username: 'lampola',
      name: 'Markus T. Lampola',
      password: 'salakala'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAfterOperation = await usersInDb()

    expect(usersAfterOperation.length).toBe(usersBeforeOperation.length + 1)
    const usernames = usersAfterOperation.map(u => u.username)
    expect(usernames).toContain(newUser.username)
    expect(usersAfterOperation.find(u => u.username === newUser.username).adult).toBe(true)
  })
})

afterAll(() => {
  server.close()
})