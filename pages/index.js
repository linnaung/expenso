import {useEffect,useState} from 'react'
import Layout from '../components/Layout'
import ExpenseList from '../components/ExpenseList'
import Chart from '../components/Chart'

export default function Home(){
  const [items,setItems]=useState([])
  const [filter,setFilter]=useState({start:'',end:'',category:'',tag:''})

  async function load(){
    const qs = new URLSearchParams(filter)
    const res = await fetch('/api/expenses?'+qs.toString())
    const data = await res.json()
    setItems(data)
  }

  useEffect(()=>{load()},[filter])

  async function handleDelete(id){
    await fetch('/api/expenses?id='+id,{method:'DELETE'})
    load()
  }

  function handleEdit(e){
    // navigate to add page with id as query param
    window.location.href = '/add?id='+e.id
  }

  function exportCSV(){
    const qs = new URLSearchParams({...filter,export:'csv'})
    window.location.href = '/api/expenses?'+qs.toString()
  }

  return (
    <Layout>
      <div style={{display:'grid',gap:10}}>
        <div className="row">
          <input type="date" value={filter.start} onChange={e=>setFilter(f=>({...f,start:e.target.value}))} />
          <input type="date" value={filter.end} onChange={e=>setFilter(f=>({...f,end:e.target.value}))} />
          <select value={filter.category} onChange={e=>setFilter(f=>({...f,category:e.target.value}))}>
            <option value="">All</option>
            <option>Food</option>
            <option>Transport</option>
            <option>Rent</option>
            <option>Entertainment</option>
            <option>Other</option>
          </select>
          <input placeholder="tag" value={filter.tag} onChange={e=>setFilter(f=>({...f,tag:e.target.value}))} />
          <button onClick={exportCSV}>Export CSV</button>
        </div>

        <ExpenseList items={items} onDelete={handleDelete} onEdit={handleEdit} />
        <Chart items={items} />
      </div>
    </Layout>
  )
}
