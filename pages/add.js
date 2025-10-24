import {useRouter} from 'next/router'
import {useEffect,useState} from 'react'
import Layout from '../components/Layout'
import ExpenseForm from '../components/ExpenseForm'

export default function Add(){
  const router = useRouter()
  const {id} = router.query
  const [initial,setInitial]=useState(null)

  useEffect(()=>{if(id){fetch('/api/expenses').then(r=>r.json()).then(list=>{const it=list.find(x=>String(x.id)===String(id)); if(it) setInitial(it)})}},[id])

  async function save(payload){
    if(id){
      await fetch('/api/expenses',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({...payload,id:Number(id)})})
    } else {
      await fetch('/api/expenses',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)})
    }
    router.push('/')
  }

  return (
    <Layout title={id? 'Edit expense':'Add expense'}>
      <ExpenseForm initial={initial} onSave={save} />
    </Layout>
  )
}
