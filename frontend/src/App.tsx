import React, { FormEvent } from 'react';
import './App.css';
import { LOREM_IPSUM, EMOJI } from './lorem_ipsum';

interface Post {
  title: string
  body: string
}

const INITIAL_POSTS: Array<Post> = [
  {title: "This is the first post!", body: "Wow, a post body."},
  {title: "Here's some lorem ipsum.", body: LOREM_IPSUM},
  {title: "Some emoji 😎", body: EMOJI}
]

function App(): JSX.Element {
  const [count, setCount] = React.useState(123)
  const [showPostForm, setShowPostForm] = React.useState(false)
  const [posts, setPosts] = React.useState(INITIAL_POSTS)

  function handleFormCancel() { setShowPostForm(false) }
  function handleFormSubmit(newPost: Post) {
    setPosts([newPost].concat(posts))
    setShowPostForm(false);
  }

  return (
    <div>
      <h1>Buttons</h1>
      <p>Here are a couple of buttons because wow I'm learning react omg</p>
      <Button count={count} onClick={() => setCount(count-1)} />
      <Button count={count} onClick={() => setCount(count+1)} />

      <h1>Posts</h1>
      {
        showPostForm ?
        <PostForm handleCancel={handleFormCancel} handleSubmit={handleFormSubmit}/> :
        <button onClick={() => setShowPostForm(true)}>
          Write a new post
        </button>
      }
      <Posts posts={posts}/>
    </div>
  )
}

function Button({count, onClick}: {count: number, onClick: () => void}): JSX.Element {
  return (
    <button onClick={onClick}>{count}</button>
  )
}

function Posts({posts}: {posts: Array<Post>}): JSX.Element {
  return (<>
    {
      posts.map((post) => (
        <Post
          title={post.title}
          body={post.body}
        />
      ))
    }
  </>)
}

function Post(props: Post): JSX.Element {
  const [expanded, setExpanded] = React.useState(false)
  function handleClick() {
    setExpanded(!expanded)
  }
  return (
    <>
      <h2>
        {props.title}
        <button onClick={handleClick}>{expanded ? "Hide" : "Expand"}</button>
      </h2>
      {expanded && <p>{props.body}</p>}
    </>
  )
}

function PostForm(
  { handleSubmit, handleCancel }: {
    handleSubmit: (post: Post) => void,
    handleCancel: () => void
  }
): JSX.Element {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");

  function passAlongSubmission(e: FormEvent) {
    e.preventDefault()
    handleSubmit({title, body})
  }

  return (
    <form onSubmit={passAlongSubmission}>
      <label>
        Title
        <input onChange={(e) => setTitle(e.target.value)}></input>
      </label>

      <label>
        Contents
        <textarea onChange={(e) => setBody(e.target.value)}></textarea>
      </label>

      <input type="button" value="Cancel" onClick={handleCancel} />
      <input type="submit" value="Submit"/>
    </form>
  )
}

export default App
