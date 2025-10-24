import fs from 'fs'
import path from 'path'

const dataDir = path.resolve(process.cwd(), '.data')
const filePath = path.join(dataDir, 'expenses.json')

function ensureDir(){
  if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, {recursive:true})
  if(!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({items:[],nextId:1}))
}

export function readStore(){
  ensureDir()
  try{
    const raw = fs.readFileSync(filePath,'utf8')
    return JSON.parse(raw)
  }catch(e){
    return {items:[],nextId:1}
  }
}

export function writeStore(store){
  ensureDir()
  fs.writeFileSync(filePath,JSON.stringify(store,null,2),'utf8')
}
