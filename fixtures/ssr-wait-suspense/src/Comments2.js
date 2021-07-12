import { useFetch, useSuspenseFetch } from 'use-suspense-fetch'

const API_DELAY = 2000
const fakeData = [
  "Wait, it doesn't wait for React to load?",
  'How does this even work?',
  'I like marshmallows'
]

export default function Comments2({ subreddit }) {
  const { peek } = useSuspenseFetch()
  console.log('-- peek react --', peek(subreddit))
  const response = useFetch(
    subreddit,
    () =>
      new Promise(resolve =>
        setTimeout(() => {
          resolve(fakeData)
        }, API_DELAY)
      )
  )

  console.log('post:', response)
  return (
    <ul>
      {response.map((post, i) => (
        <li key={i}>{post}</li>
      ))}
    </ul>
  )
}
