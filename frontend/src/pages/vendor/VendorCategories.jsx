import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import api from '../../api/axios'
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown, FolderOpen, Folder, AlertCircle, Save } from 'lucide-react'
import { Button, Input, Textarea, Modal, EmptyState } from '../../components/ui/index'
import toast from 'react-hot-toast'

const DEPTH_BG = ['bg-indigo-600','bg-violet-500','bg-blue-500']
const DEPTH_INDENT = [0,20,40]

function CategoryRow({cat,depth=0,onEdit,onDelete,onAddChild}){
  const[expanded,setExpanded]=useState(true)
  const hasChildren=cat.children?.length>0
  return(
    <div>
      <div className={`group flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100`}
        style={{marginLeft:DEPTH_INDENT[depth]||depth*20}}>
        <button type="button" onClick={()=>setExpanded(!expanded)} className="w-4 h-4 flex items-center justify-center text-gray-400 flex-shrink-0">
          {hasChildren?(expanded?<ChevronDown size={13}/>:<ChevronRight size={13}/>):<div className="w-1.5 h-1.5 rounded-full bg-gray-200"/>}
        </button>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${DEPTH_BG[depth]||'bg-gray-400'}`}>
          {hasChildren?<FolderOpen size={11} className="text-white"/>:<Folder size={11} className="text-white"/>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 text-sm truncate">{cat.name}</span>
            {depth===0&&<span className="badge badge-gray text-[10px]">Root</span>}
            {depth===1&&<span className="badge badge-blue text-[10px]">Sub</span>}
            {depth>=2&&<span className="badge badge-purple text-[10px]">Sub-Sub</span>}
            {!cat.isActive&&<span className="badge badge-red text-[10px]">Hidden</span>}
          </div>
          <p className="text-xs text-gray-400">/{cat.slug}{cat.productCount>0?` · ${cat.productCount} products`:''}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {depth<2&&<button onClick={()=>onAddChild(cat)} className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg"><Plus size={11}/> Sub</button>}
          <button onClick={()=>onEdit(cat)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={13} className="text-gray-500"/></button>
          <button onClick={()=>onDelete(cat)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={13} className="text-red-400"/></button>
        </div>
      </div>
      {hasChildren&&expanded&&(
        <div className="border-l-2 border-gray-100 ml-7">
          {cat.children.map(child=><CategoryRow key={child._id} cat={child} depth={depth+1} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild}/>)}
        </div>
      )}
    </div>
  )
}

const EMPTY={name:'',description:'',image:'',parent:'',sortOrder:0,isActive:true,seo:{metaTitle:'',metaDescription:''}}

export default function VendorCategories(){
  const{myStore}=useSelector(s=>s.store)
  const[tree,setTree]=useState([])
  const[flatList,setFlatList]=useState([])
  const[loading,setLoading]=useState(true)
  const[modal,setModal]=useState(false)
  const[editing,setEditing]=useState(null)
  const[delTarget,setDelTarget]=useState(null)
  const[delError,setDelError]=useState('')
  const[form,setForm]=useState(EMPTY)
  const[saving,setSaving]=useState(false)
  const[view,setView]=useState('tree')
  const storeSlug=myStore?.slug

  const fetch=useCallback(async()=>{
    if(!storeSlug)return
    setLoading(true)
    try{
      const[tRes,fRes]=await Promise.all([
        api.get('/categories?tree=true&activeOnly=false',{headers:{'x-store-slug':storeSlug}}),
        api.get('/categories?activeOnly=false',{headers:{'x-store-slug':storeSlug}}),
      ])
      setTree(tRes.data.data)
      setFlatList(fRes.data.data)
    }catch{toast.error('Failed to load')}
    finally{setLoading(false)}
  },[storeSlug])

  useEffect(()=>{fetch()},[fetch])

  const openCreate=(parentCat=null)=>{
    setEditing(null)
    setForm({...EMPTY,parent:parentCat?._id||''})
    setModal(true)
  }
  const openEdit=(cat)=>{
    setEditing(cat)
    setForm({name:cat.name,description:cat.description||'',image:cat.image||'',parent:cat.parent?._id||cat.parent||'',sortOrder:cat.sortOrder||0,isActive:cat.isActive,seo:cat.seo||{metaTitle:'',metaDescription:''}})
    setModal(true)
  }

  const handleSave=async()=>{
    if(!form.name.trim())return toast.error('Name required')
    setSaving(true)
    try{
      const payload={...form,parent:form.parent||null}
      if(editing)await api.put(`/categories/${editing._id}`,payload,{headers:{'x-store-slug':storeSlug}})
      else await api.post('/categories',payload,{headers:{'x-store-slug':storeSlug}})
      toast.success(editing?'Updated!':'Created!')
      setModal(false);fetch()
    }catch(err){toast.error(err.response?.data?.message||'Failed')}
    finally{setSaving(false)}
  }

  const handleDelete=async()=>{
    setDelError('')
    try{
      await api.delete(`/categories/${delTarget._id}`,{headers:{'x-store-slug':storeSlug}})
      toast.success('Deleted');setDelTarget(null);fetch()
    }catch(err){setDelError(err.response?.data?.message||'Failed to delete')}
  }

  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const parentOptions=flatList.filter(c=>!(editing&&c._id===editing._id)&&c.depth<2)

  return(
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Categories</h1><p className="page-subtitle">{flatList.length} total · supports root / sub / sub-sub levels</p></div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {['tree','flat'].map(v=>(
              <button key={v} onClick={()=>setView(v)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${view===v?'bg-white text-indigo-600 shadow-sm':'text-gray-500'}`}>{v}</button>
            ))}
          </div>
          <Button onClick={()=>openCreate()}><Plus size={15}/> Add Category</Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {[['Root','bg-indigo-600','e.g. Electronics'],['Sub','bg-violet-500','e.g. Phones'],['Sub-Sub','bg-blue-500','e.g. Smartphones']].map(([label,color,ex])=>(
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${color}`}/>
            <span className="text-gray-500"><strong className="text-gray-700">{label}</strong> — {ex}</span>
          </div>
        ))}
      </div>

      <div className="card p-4">
        {loading?<div className="space-y-3">{Array(4).fill(0).map((_,i)=><div key={i} className="skeleton h-12 rounded-xl"/>)}</div>
          :tree.length===0?<EmptyState icon={Folder} title="No categories yet" description="Create categories to organize products. Supports 3 levels." action={<Button onClick={()=>openCreate()}><Plus size={14}/> Create First</Button>}/>
          :view==='tree'?(
            <div className="space-y-0.5">
              {tree.map(cat=><CategoryRow key={cat._id} cat={cat} depth={0} onEdit={openEdit} onDelete={c=>{setDelTarget(c);setDelError('')}} onAddChild={c=>openCreate(c)}/>)}
            </div>
          ):(
            <table className="table">
              <thead><tr><th>Name</th><th>Parent</th><th>Level</th><th>Products</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {[...flatList].sort((a,b)=>a.depth-b.depth||a.name.localeCompare(b.name)).map(cat=>(
                  <tr key={cat._id}>
                    <td><div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${DEPTH_BG[cat.depth]||'bg-gray-400'}`}/><span className="font-medium text-sm">{cat.name}</span></div></td>
                    <td className="text-gray-500 text-sm">{cat.parent?.name||'—'}</td>
                    <td><span className="text-xs text-gray-400">Level {cat.depth+1}</span></td>
                    <td className="font-semibold">{cat.productCount||0}</td>
                    <td><span className={`badge ${cat.isActive?'badge-green':'badge-gray'}`}>{cat.isActive?'Active':'Hidden'}</span></td>
                    <td><div className="flex gap-1">
                      <button onClick={()=>openEdit(cat)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={13} className="text-gray-500"/></button>
                      <button onClick={()=>{setDelTarget(cat);setDelError('')}} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={13} className="text-red-400"/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editing?`Edit: ${editing.name}`:form.parent?`Add Sub-Category`:'New Category'} size="md">
        <div className="space-y-4">
          <Input label="Category Name *" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Electronics" autoFocus/>
          <div>
            <label className="label">Parent Category</label>
            <select value={form.parent} onChange={e=>set('parent',e.target.value)} className="input">
              <option value="">None (Root Category)</option>
              {parentOptions.map(c=><option key={c._id} value={c._id}>{'— '.repeat(c.depth)}{c.name}</option>)}
            </select>
          </div>
          <Textarea label="Description" value={form.description} onChange={e=>set('description',e.target.value)} rows={2} placeholder="Optional"/>
          <Input label="Image URL (optional)" value={form.image} onChange={e=>set('image',e.target.value)} placeholder="https://..."/>
          {form.image&&<img src={form.image} alt="" className="w-20 h-20 object-cover rounded-xl border"/>}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sort Order" type="number" value={form.sortOrder} onChange={e=>set('sortOrder',Number(e.target.value))}/>
            <div>
              <label className="label">Visibility</label>
              <label className="flex items-center gap-2 cursor-pointer mt-1.5">
                <input type="checkbox" checked={form.isActive} onChange={e=>set('isActive',e.target.checked)} className="w-4 h-4 rounded accent-indigo-600"/>
                <span className="text-sm font-medium text-gray-700">Visible</span>
              </label>
            </div>
          </div>
          <details className="border border-gray-100 rounded-xl">
            <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-gray-700">SEO (optional)</summary>
            <div className="px-4 pb-4 space-y-3 mt-2">
              <Input label="Meta Title" value={form.seo.metaTitle} onChange={e=>set('seo',{...form.seo,metaTitle:e.target.value})}/>
              <Textarea label="Meta Description" value={form.seo.metaDescription} onChange={e=>set('seo',{...form.seo,metaDescription:e.target.value})} rows={2}/>
            </div>
          </details>
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="secondary" onClick={()=>setModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}><Save size={14}/> {editing?'Update':'Create'}</Button>
          </div>
        </div>
      </Modal>

      {delTarget&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>{setDelTarget(null);setDelError('')}}/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={20} className="text-red-500"/></div>
            <h3 className="font-display text-lg font-bold text-gray-900 text-center mb-1">Delete "{delTarget.name}"?</h3>
            <p className="text-sm text-gray-500 text-center mb-4">This cannot be undone.</p>
            {delError&&<div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4"><AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5"/><p className="text-sm text-red-700">{delError}</p></div>}
            <div className="flex gap-3"><Button variant="secondary" className="flex-1" onClick={()=>{setDelTarget(null);setDelError('')}}>Cancel</Button><Button variant="danger" className="flex-1" onClick={handleDelete}>Delete</Button></div>
          </div>
        </div>
      )}
    </div>
  )
}
