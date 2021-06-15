import * as React from 'react'
import * as ReactDOM from 'react-dom'
import fetchSuspense, { clear } from '../../src/index'

function Picker({ value, onChange, options }) {
  return (
    <select onChange={e => onChange(e.target.value)} value={value}>
      {options.map(option => (
        <option value={option} key={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function BasicFetch() {
  const [isRefreshing, startRefreshing] = (React as any).useTransition()
  const [subreddit, setSubreddit] = React.useState('reactjs')

  console.log('isRefreshing:', isRefreshing)
  return (
    <div>
      <h2>Basic Fetch</h2>
      <Picker
        value={subreddit}
        onChange={setSubreddit}
        options={['reactjs', 'frontend']}
      />
      <button
        onClick={() => {
          startRefreshing(() => {
            clear()
          })
        }}
      >
        Refresh
      </button>
      <div style={{ opacity: isRefreshing ? 0.5 : 1 }}>
        <React.Suspense fallback={<h1>Loading...</h1>}>
          <Post subreddit={subreddit} />
        </React.Suspense>
      </div>
    </div>
  )
}

function Post({ subreddit }: any) {
  const response = fetchSuspense(
    () =>
      fetch(`https://www.reddit.com/r/${subreddit}.json`).then(res =>
        res.json()
      ),
    subreddit
  )
  const post = response.data.children.map(child => child.data)
  console.log('post:', subreddit)
  return (
    <ul>
      {post.map((post: any, i: number) => (
        <li key={i}>{post.title}</li>
      ))}
    </ul>
  )
}

const root = (ReactDOM as any).createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <BasicFetch />
  </React.StrictMode>
)
