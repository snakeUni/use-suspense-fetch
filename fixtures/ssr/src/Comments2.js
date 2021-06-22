import suspenseFetch, { peek } from '../../../lib'
import { useCtx } from './data'

const API_DELAY = 2000
const fakeData = [
  "Wait, it doesn't wait for React to load?",
  'How does this even work?',
  'I like marshmallows'
]

export default function Comments2({ subreddit }) {
  const ctx = useCtx()
  console.log('peek:', peek(subreddit))
  // 会缓存，因为应该记得清楚缓存
  const response = suspenseFetch(
    subreddit,
    () =>
      new Promise(resolve =>
        setTimeout(() => {
          resolve(fakeData)
        }, API_DELAY)
      ),
    {
      ssr: ctx ? true : false
    }
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
