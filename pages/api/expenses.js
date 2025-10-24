import {readStore,writeStore} from '../../lib/store'

function toCSV(out){
  const header = 'id,amount,category,date,description,tags\n'
  const rows = out.map(i=>`${i.id},${i.amount},"${i.category}",${i.date},"${(i.description||'').replace(/"/g,'""')}","${(i.tags||[]).join(';')}"`).join('\n')
  return header+rows
}

export default function handler(req,res){
  const {method,query,body}=req
  const store = readStore()
  let {items,nextId} = store

  if(method==='GET'){
    const {start,end,category,tag,export:ex} = query
    let out = items.slice().sort((a,b)=>b.date.localeCompare(a.date))
    if(start) out = out.filter(i=>i.date>=start)
    if(end) out = out.filter(i=>i.date<=end)
    if(category) out = out.filter(i=>i.category===category)
    if(tag) out = out.filter(i=>(i.tags||[]).includes(tag))
    if(ex==='csv'){
      res.setHeader('Content-Type','text/csv')
      res.setHeader('Content-Disposition','attachment; filename=expenses.csv')
      res.status(200).send(toCSV(out))
      return
    }
    res.status(200).json(out)
    return
  }

  if(method==='POST'){
    const {amount,category,date,description,tags} = body
    const it = {id:nextId++,amount:Number(amount||0),category:category||'Other',date:date||new Date().toISOString().slice(0,10),description:description||'',tags:tags||[]}
    items.push(it)
    writeStore({items,nextId})
    res.status(201).json(it)
    return
  }

  if(method==='PUT'){
    const {id,amount,category,date,description,tags} = body
    const idx = items.findIndex(x=>x.id===Number(id))
    if(idx===-1) return res.status(404).json({error:'not found'})
    items[idx] = {...items[idx],amount:Number(amount||0),category,date,description,tags}
    writeStore({items,nextId})
    return res.status(200).json(items[idx])
  }

  if(method==='DELETE'){
    const id = Number(query.id)
    items = items.filter(x=>x.id!==id)
    writeStore({items,nextId})
    return res.status(204).end()
  }

  res.setHeader('Allow',['GET','POST','PUT','DELETE'])
  res.status(405).end('Method not allowed')
}
