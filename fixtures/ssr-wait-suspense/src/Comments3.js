// 使用 react fetch fork from https://codesandbox.io/s/misty-frog-qvqbg?file=/src/App.js
import { fetch } from 'react-fetch'

export default function Posts() {
  const posts = fetch('localhost:4000/react.json').json()

  console.log('react fetch json:', posts)

  return (
    <ul>
      {posts.map((post, i) => (
        <li key={i}>{post.title}</li>
      ))}
    </ul>
  )
}
