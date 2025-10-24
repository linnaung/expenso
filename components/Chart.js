export default function Chart({items=[]}){
  // small bar chart by category totals
  const totals = items.reduce((acc,it)=>{acc[it.category]=(acc[it.category]||0)+Number(it.amount||0);return acc},{})
  const entries = Object.entries(totals)
  const max = Math.max(1,...entries.map(e=>e[1]))
  return (
    <div style={{marginTop:12}}>
      <h3 className="small">By category</h3>
      <div style={{display:'flex',gap:10,alignItems:'end',height:120}}>
        {entries.map(([cat,val])=>{
          const h = Math.round((val/max)*100)
          return <div key={cat} style={{flex:1,textAlign:'center'}}>
            <div style={{height:Math.max(6,h)+'px',background:'#60a5fa',borderRadius:6,marginBottom:6}} title={`${cat}: ${val.toFixed(2)}`}></div>
            <div className="muted small">{cat}</div>
          </div>
        })}
        {entries.length===0 && <div className="muted">No data</div>}
      </div>
    </div>
  )
}
