import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  UseQueryResult,
} from '@tanstack/react-query'

const BASE_URL = "http://localhost:8000"
const BASE_URL_SUBSCRIPTIONS = "ws://localhost:8000/subscribe"

interface Post {
  id: string
  title: string
  body: string
}

interface PostTitleOnly {
  id: string
  title: string
  body: string
}

interface AllPostsResponse {
  data: Array<Post> | Array<PostTitleOnly>
}

class SubscriptionClient {

}

interface SubscriptionRequest {
  requestID: string
  urlPath: Array<string>
}

const queryClient = new QueryClient()
const subscriptionClient = new SubscriptionClient()

function App(): JSX.Element {
  const [count, setCount] = React.useState(123)

  function onClick() {
    setCount(count+1)
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <Button count={count} onClick={onClick} />
        <Button count={count} onClick={onClick} />
        <Posts />
      </div>
    </QueryClientProvider>
  )
}

function Button({count, onClick}: {count: number, onClick: () => void}): JSX.Element {
  return (
    <button onClick={onClick}>{count}</button>
  )
}

function useAllPostsList(): UseQueryResult<AllPostsResponse, unknown> {
  async function fetchAllPosts(): Promise<AllPostsResponse> {
    const url = `${BASE_URL}/posts`
    const response = await fetch(url)
    if (!response.ok) throw new Error("Response not OK.")
    return response.json()
  }

  const urlPath = ["posts"]
  // TODO: This should happen after the WebSocket is set up.
  const query = useQuery({
    queryKey: urlPath,
    queryFn: () => fetchAllPosts(),
    staleTime: Infinity
  })
  const queryClient = useQueryClient()

  // TODO: This apparently unsubscribes and resubscribes every time we click the buttons, which...does not seem like what we want.
  useEffect(
      () => {
      console.log("Subscribing to WebSocket.")
      const websocket = new WebSocket(BASE_URL_SUBSCRIPTIONS)
      const randomID = Math.random().toString()
      websocket.onopen = () => {
        const subscriptionRequest: SubscriptionRequest = {
          requestID: randomID,
          urlPath: urlPath,
        }
        websocket.send(JSON.stringify(subscriptionRequest))
      }
      websocket.onmessage = (event) => {
        console.log(event)
        const data = JSON.parse(event.data)
        if (data.inResponseToRequestID === randomID) {
          queryClient.invalidateQueries({queryKey: urlPath})
        }
      }

      return () => {
        console.log("Unsubscribing from Websocket.")
        websocket.close()
      }
    },
    []
  )

  return query
}

function Posts(): JSX.Element {
  const postsList = useAllPostsList()

  // // Mutations
  // // const mutation = useMutation({
  // //   mutationFn: postTodo,
  // //   onSuccess: () => {
  // //     // Invalidate and refetch
  // //     queryClient.invalidateQueries({ queryKey: ['todos'] })
  // //   },
  // // })

  return (
    <div>
      <h1>Posts</h1>
      <ul>
        {postsList.data?.data.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  )
}


export default App;




// TODO:
// Parent connection WS thing with reconnection
// Logical multiplexed subscription inner connection
// useEffect so sub/unsub from logical multiplexed subscription thing
