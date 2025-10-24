import Link from 'next/link'
export default function ExpenseList({items=[], onDelete, onEdit}){
  return (
    <div style={{marginTop:8}}>
      {items.length===0 && <div className="muted">No expenses yet</div>}
      {items.map(e=> (
        <div className="expense-item" key={e.id}>
          <div>
            <div style={{fontWeight:600}}>${Number(e.amount).toFixed(2)} · <span className="muted small">{e.category}</span></div>
            <div className="muted small">{e.date} — {e.description}</div>
            <div className="tags">{(e.tags||[]).map(t=>(<div className="tag" key={t}>{t}</div>))}</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
            <button onClick={()=>onEdit?.(e)} className="small">Edit</button>
            <button onClick={()=>onDelete?.(e.id)} style={{background:'transparent',color:'var(--danger)'}}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
