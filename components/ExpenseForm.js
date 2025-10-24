import {useState,useEffect} from 'react'

export default function ExpenseForm({initial, onSave}){
  const [amount,setAmount]=useState(initial?.amount||'')
  const [category,setCategory]=useState(initial?.category||'Other')
  const [date,setDate]=useState(initial?.date||new Date().toISOString().slice(0,10))
  const [description,setDescription]=useState(initial?.description||'')
  const [tags,setTags]=useState((initial?.tags||[]).join(','))

  // Sync state when `initial` prop changes (important when navigating to edit page)
  useEffect(()=>{
    if(!initial) return
    setAmount(initial.amount||'')
    setCategory(initial.category||'Other')
    setDate(initial.date||new Date().toISOString().slice(0,10))
    setDescription(initial.description||'')
    setTags((initial.tags||[]).join(','))
  },[initial])

  const submit = e =>{
    e.preventDefault()
    const payload = {amount:parseFloat(amount)||0,category,date,description,tags:tags.split(',').map(t=>t.trim()).filter(Boolean)}
    // include id when editing
    if(initial?.id) payload.id = initial.id
    onSave(payload)
  }

  return (
    <form onSubmit={submit} style={{display:'grid',gap:8}}>
      <div className="row">
        <input placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} />
        <select value={category} onChange={e=>setCategory(e.target.value)}>
          <option>Food</option>
          <option>Transport</option>
          <option>Rent</option>
          <option>Entertainment</option>
          <option>Other</option>
        </select>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
      </div>
      <input placeholder="Short description" value={description} onChange={e=>setDescription(e.target.value)} />
      <input placeholder="tags (comma separated)" value={tags} onChange={e=>setTags(e.target.value)} />
      <div className="row">
        <button type="submit">Save</button>
      </div>
    </form>
  )
}
