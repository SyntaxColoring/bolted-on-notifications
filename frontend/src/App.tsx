import React, { FormEvent } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

import './App.css';
import { LOREM_IPSUM, EMOJI } from './lorem_ipsum';
import { usePosts } from './hooks';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { WS_URL, BASE_URL } from './urls';

interface Post {
  title: string
  body: string
}

const INITIAL_POSTS: Array<Post> = [
  {title: "This is the first post!", body: "Wow, a post body."},
  {title: "Here's some lorem ipsum.", body: LOREM_IPSUM},
  {title: "Some emoji 😎", body: EMOJI}
]

const queryClient = new QueryClient()
const webSocket = new ReconnectingWebSocket(WS_URL)

function App(): JSX.Element {
  const [showApp, setShowApp] = React.useState(true)
  return (
    <>
      <button onClick={() => setShowApp(!showApp)}>Show/hide app</button>
      <QueryClientProvider client={queryClient}>
        {showApp && <Main />}
      </QueryClientProvider>
    </>
  )
}

function Main(): JSX.Element {
  const [count, setCount] = React.useState(123)
  const [showPostForm, setShowPostForm] = React.useState(false)

  const postsQueryResult = usePosts(webSocket)
  const posts = postsQueryResult.data?.data || []
  const isLoading = postsQueryResult.isLoading || postsQueryResult.isFetching

  function handleFormCancel() { setShowPostForm(false) }
  function handleFormSubmit(newPost: Post) {
    // TODO: Make this a react-query mutation.
    fetch(
      `${BASE_URL}/posts`, {
        method: "POST",
        body: JSON.stringify(newPost)
      })
    setShowPostForm(false);
  }

  return (
    <div>
      <h1>Buttons</h1>
      <p>Here are a couple of buttons because wow I'm learning react omg</p>
      <Button count={count} onClick={() => setCount(count-1)} />
      <Button count={count} onClick={() => setCount(count+1)} />

      <h1>Posts</h1>
      <p>Status: {postsQueryResult.status}</p>
      <p>Fetch status: {postsQueryResult.fetchStatus}</p>
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

function Posts({posts}: {posts: Array<Post & {id: string}>}): JSX.Element {
  return (<>
    {
      posts.map((post) => (
        <Post
          key={post.id}
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
