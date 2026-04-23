import { useState, useEffect, useRef } from 'react'
import { attributesApi } from '../../api/services'
import { Plus, X, Zap, ChevronDown, ChevronUp, Palette, Image, List, CheckSquare, Type, Hash, Check, Trash2, Layers, ChevronRight, Tag } from 'lucide-react'
import { Button, Spinner } from '../../components/ui/index'
import toast from 'react-hot-toast'

const TYPE_ICONS = { dropdown:List, checkbox:CheckSquare, color_swatch:Palette, image_swatch:Image, text:Type, number:Hash }

function VariantRow({variant,index,currency,onChange,onRemove}){
  return(
    <tr className={index%2===0?'bg-white':'bg-gray-50'}>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(variant.options||[]).map((opt,i)=>(
            <span key={i} className="flex items-center gap-1 text-xs">
              {opt.colorHex&&<span className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0" style={{backgroundColor:opt.colorHex}}/>}
              {opt.imageUrl&&<img src={opt.imageUrl} alt="" className="w-4 h-4 rounded object-cover flex-shrink-0"/>}
              <span className="font-medium text-gray-700">{opt.value}</span>
              {i<(variant.options?.length||0)-1&&<span className="text-gray-300">/</span>}
            </span>
          ))}
          {variant._temp&&<span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">NEW</span>}
        </div>
      </td>
      <td className="px-2 py-2"><input type="text" value={variant.sku||''} onChange={e=>onChange(index,'sku',e.target.value)} placeholder="SKU" className="input text-xs py-1.5 w-24"/></td>
      <td className="px-2 py-2">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">{currency}</span>
          <input type="number" step="0.01" min="0" value={variant.price!==undefined&&variant.price!==''?variant.price:''} onChange={e=>onChange(index,'price',e.target.value===''?'':parseFloat(e.target.value))} className="input text-xs py-1.5 pl-6 w-24"/>
        </div>
      </td>
      <td className="px-2 py-2"><input type="number" min="0" value={variant.inventory??0} onChange={e=>onChange(index,'inventory',parseInt(e.target.value)||0)} className="input text-xs py-1.5 w-20"/></td>
      <td className="px-2 py-2"><input type="url" value={variant.image||''} onChange={e=>onChange(index,'image',e.target.value)} placeholder="Image URL" className="input text-xs py-1.5 w-28"/></td>
      <td className="px-2 py-2 text-center">
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={variant.isActive!==false} onChange={e=>onChange(index,'isActive',e.target.checked)} className="sr-only peer"/>
          <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"/>
        </label>
      </td>
      <td className="px-2 py-2 text-center"><button type="button" onClick={()=>onRemove(index)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={12}/></button></td>
    </tr>
  )
}

function ValuePicker({attr,selectedIds,onToggle}){
  const Icon=TYPE_ICONS[attr.type]||List
  const allSel=attr.values.length>0&&attr.values.every(v=>selectedIds.includes(v._id))
  const toggleAll=()=>{
    if(allSel){attr.values.forEach(v=>{if(selectedIds.includes(v._id))onToggle(attr._id,v._id)})}
    else{attr.values.forEach(v=>{if(!selectedIds.includes(v._id))onToggle(attr._id,v._id)})}
  }
  return(
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
        <Icon size={12} className="text-gray-400 flex-shrink-0"/>
        <span className="font-semibold text-sm text-gray-700 flex-1">{attr.name}</span>
        <span className="text-xs text-gray-400">{selectedIds.length}/{attr.values.length}</span>
        <button type="button" onClick={toggleAll} className="text-xs text-indigo-600 font-semibold hover:underline flex-shrink-0">{allSel?'Deselect all':'Select all'}</button>
      </div>
      <div className="p-3 flex flex-wrap gap-2">
        {attr.values.length===0?(
          <p className="text-xs text-gray-400 italic">No values — <a href="/dashboard/attributes" target="_blank" className="text-indigo-500 hover:underline">add in Attributes Manager</a></p>
        ):attr.values.map(v=>{
          const sel=selectedIds.includes(v._id)
          return(
            <button key={v._id} type="button" onClick={()=>onToggle(attr._id,v._id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${sel?'bg-indigo-600 text-white border-indigo-600 shadow-sm':'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
              {attr.type==='color_swatch'&&<span className="w-3 h-3 rounded-full border border-white/40 flex-shrink-0" style={{backgroundColor:v.colorHex||'#ccc'}}/>}
              {attr.type==='image_swatch'&&v.imageUrl&&<img src={v.imageUrl} alt="" className="w-4 h-4 rounded object-cover flex-shrink-0"/>}
              {v.label}
              {sel&&<Check size={10}/>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AttributeVariantPanel({storeSlug,price,currency,variants=[],onVariantsChange,productAttributes=[],onAttributesChange}){
  const[allAttrs,setAllAttrs]=useState([])
  const[loading,setLoading]=useState(false)
  const[generating,setGenerating]=useState(false)
  const[dropOpen,setDropOpen]=useState(false)
  const[showVariants,setShowVariants]=useState(false)
  const dropRef=useRef(null)

  const[selectedAttrIds,setSelectedAttrIds]=useState([])
  const[selectedValues,setSelectedValues]=useState({})
  const[variantRows,setVariantRows]=useState([])
  const[synced,setSynced]=useState(false)

  // Sync from props on first render (for edit mode)
  useEffect(()=>{
    if(synced)return
    if(productAttributes.length>0){
      const ids=productAttributes.map(a=>a.attributeId?._id||a.attributeId).filter(Boolean)
      const vals={}
      productAttributes.forEach(a=>{
        const id=a.attributeId?._id||a.attributeId
        if(id)vals[id]=(a.selectedValues||[]).map(v=>v.valueId||v._id).filter(Boolean)
      })
      setSelectedAttrIds(ids)
      setSelectedValues(vals)
    }
    if(variants.length>0){setVariantRows(variants);setShowVariants(true)}
    setSynced(true)
  },[productAttributes,variants])

  useEffect(()=>{
    if(!storeSlug)return
    setLoading(true)
    attributesApi.getAll(storeSlug).then(r=>setAllAttrs(r.data.data||[])).catch(()=>{}).finally(()=>setLoading(false))
  },[storeSlug])

  useEffect(()=>{
    const h=e=>{if(dropRef.current&&!dropRef.current.contains(e.target))setDropOpen(false)}
    document.addEventListener('mousedown',h)
    return()=>document.removeEventListener('mousedown',h)
  },[])

  // Bubble productAttributes up
  useEffect(()=>{
    if(!synced)return
    const mapped=selectedAttrIds.map(id=>{
      const attr=allAttrs.find(a=>a._id===id)
      if(!attr)return null
      const selVals=(selectedValues[id]||[]).map(vid=>{
        const val=attr.values.find(v=>v._id===vid)
        return val?{valueId:val._id,label:val.label,value:val.value,colorHex:val.colorHex,imageUrl:val.imageUrl}:null
      }).filter(Boolean)
      return{attributeId:id,attributeName:attr.name,attributeType:attr.type,selectedValues:selVals,usedForVariants:attr.usedForVariants,filterable:attr.filterable,required:attr.required}
    }).filter(Boolean)
    onAttributesChange(mapped)
  },[selectedAttrIds,selectedValues,allAttrs,synced])

  // Bubble variantRows up
  useEffect(()=>{if(synced)onVariantsChange(variantRows)},[variantRows,synced])

  const toggleAttr=attrId=>{
    if(selectedAttrIds.includes(attrId)){
      setSelectedAttrIds(p=>p.filter(id=>id!==attrId))
      setSelectedValues(p=>{const n={...p};delete n[attrId];return n})
    }else{
      setSelectedAttrIds(p=>[...p,attrId])
      // Start with empty selection — user must manually pick values
      setSelectedValues(p=>({...p,[attrId]:[]}))
    }
  }

  const toggleValue=(attrId,valueId)=>{
    setSelectedValues(p=>{
      const cur=p[attrId]||[]
      return{...p,[attrId]:cur.includes(valueId)?cur.filter(v=>v!==valueId):[...cur,valueId]}
    })
  }

  const handleGenerate=async()=>{
    const variantAttrIds=selectedAttrIds.filter(id=>allAttrs.find(a=>a._id===id)?.usedForVariants)
    if(!variantAttrIds.length)return toast.error('Select at least one attribute marked "Used for Variants"')
    const emptyAttrs=variantAttrIds.filter(id=>!(selectedValues[id]?.length))
    if(emptyAttrs.length){
      return toast.error(`Select values for: ${emptyAttrs.map(id=>allAttrs.find(a=>a._id===id)?.name).join(', ')}`)
    }
    setGenerating(true)
    try{
      const{data}=await attributesApi.generateVariants(storeSlug,{
        attributeIds:variantAttrIds,
        selectedValues:selectedValues, // only selected IDs
        existingVariants:variantRows,
        priceBase:parseFloat(price)||0,
      })
      const rows=data.data||[]
      setVariantRows(rows)
      toast.success(`${rows.length} variant${rows.length!==1?'s':''} generated`)
    }catch(err){toast.error(err.response?.data?.message||'Failed')}
    finally{setGenerating(false)}
  }

  const updateVariant=(index,key,val)=>setVariantRows(p=>p.map((v,i)=>i===index?{...v,[key]:val}:v))
  const removeVariant=index=>setVariantRows(p=>p.filter((_,i)=>i!==index))

  const selectedAttrs=allAttrs.filter(a=>selectedAttrIds.includes(a._id))
  const variantCapable=selectedAttrs.filter(a=>a.usedForVariants)
  const canGenerate=variantCapable.length>0&&variantCapable.every(a=>(selectedValues[a._id]?.length||0)>0)

  if(loading)return<div className="flex items-center gap-2 text-sm text-gray-400 py-4"><Spinner size="sm"/>Loading attributes…</div>

  return(
    <div className="space-y-5">
      {/* ── Attributes section ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-gray-500"/>
            <label className="label mb-0 text-gray-700">Product Attributes</label>
            <span className="text-xs text-gray-400">(optional)</span>
          </div>
          <a href="/dashboard/attributes" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline font-medium flex-shrink-0">+ Manage Attributes</a>
        </div>

        {allAttrs.length===0?(
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center bg-gray-50">
            <Layers size={24} className="text-gray-300 mx-auto mb-2"/>
            <p className="text-sm text-gray-500 mb-1">No attributes created yet</p>
            <a href="/dashboard/attributes" target="_blank" rel="noreferrer" className="text-xs font-semibold text-indigo-600 hover:underline">Go to Attributes Manager →</a>
          </div>
        ):(
          <>
            <div className="relative" ref={dropRef}>
              <button type="button" onClick={()=>setDropOpen(o=>!o)} className="w-full input text-left flex items-center justify-between cursor-pointer text-sm">
                <span className={selectedAttrIds.length===0?'text-gray-400':'text-gray-700'}>
                  {selectedAttrIds.length===0?'Select attributes to add…':`${selectedAttrIds.length} attribute${selectedAttrIds.length!==1?'s':''} selected`}
                </span>
                {dropOpen?<ChevronUp size={14} className="text-gray-400 flex-shrink-0"/>:<ChevronDown size={14} className="text-gray-400 flex-shrink-0"/>}
              </button>
              {dropOpen&&(
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  {allAttrs.map(attr=>{
                    const Icon=TYPE_ICONS[attr.type]||List
                    const isSel=selectedAttrIds.includes(attr._id)
                    return(
                      <button key={attr._id} type="button" onClick={()=>toggleAttr(attr._id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${isSel?'bg-indigo-50':''}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSel?'bg-indigo-600 border-indigo-600':'border-gray-300'}`}>
                          {isSel&&<Check size={11} className="text-white"/>}
                        </div>
                        <Icon size={14} className="text-gray-400 flex-shrink-0"/>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-semibold text-gray-800">{attr.name}</p>
                          <p className="text-xs text-gray-400">{attr.values?.length||0} values · {attr.type.replace(/_/g,' ')}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {attr.usedForVariants&&<span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">VARIANT</span>}
                          {attr.filterable&&<span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">FILTER</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            {selectedAttrs.length>0&&(
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedAttrs.map(attr=>(
                  <span key={attr._id} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full">
                    {attr.name}
                    <button type="button" onClick={()=>toggleAttr(attr._id)} className="text-indigo-400 hover:text-indigo-700 ml-0.5"><X size={10}/></button>
                  </span>
                ))}
              </div>
            )}
            {selectedAttrs.length>0&&(
              <div className="space-y-3 mt-3">
                {selectedAttrs.map(attr=>(
                  <ValuePicker key={attr._id} attr={attr} selectedIds={selectedValues[attr._id]||[]} onToggle={toggleValue}/>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Variants section (collapsible) ── */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden">
        <button type="button" onClick={()=>setShowVariants(v=>!v)}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
          <div className="flex items-center gap-2.5">
            <Zap size={15} className="text-purple-600"/>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Variants <span className="ml-1.5 text-xs font-normal text-gray-400">(optional)</span></p>
              <p className="text-xs text-gray-400">
                {variantRows.length>0?`${variantRows.length} variant${variantRows.length!==1?'s':''} configured`:'Auto-generate size/colour/storage combos'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {variantRows.length>0&&<span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{variantRows.length}</span>}
            {showVariants?<ChevronUp size={15} className="text-gray-400"/>:<ChevronRight size={15} className="text-gray-400"/>}
          </div>
        </button>

        {showVariants&&(
          <div className="border-t border-gray-100 p-4 space-y-4">
            {variantCapable.length===0?(
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                <strong>How to generate variants:</strong>
                <ol className="mt-1.5 space-y-1 list-decimal list-inside">
                  <li>Select attributes above (e.g. Color, Size)</li>
                  <li>Ensure they're marked "Used for Variants" in <a href="/dashboard/attributes" target="_blank" className="underline font-semibold">Attributes Manager</a></li>
                  <li>Pick specific values (e.g. Red, Blue, S, M, L)</li>
                  <li>Click Generate below</li>
                </ol>
              </div>
            ):(
              <div className="flex items-center justify-between flex-wrap gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-purple-900">Generate from: <strong>{variantCapable.map(a=>a.name).join(' × ')}</strong></p>
                  <p className="text-xs text-purple-600 mt-0.5">
                    {variantCapable.map(a=>`${a.name}: ${selectedValues[a._id]?.length||0} value${(selectedValues[a._id]?.length||0)!==1?'s':''}`).join(' · ')}
                  </p>
                  {!canGenerate&&<p className="text-xs text-amber-600 font-semibold mt-1">⚠ Select values for each attribute above first</p>}
                </div>
                <Button type="button" onClick={handleGenerate} loading={generating} disabled={!canGenerate}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-0 text-sm px-4 py-2 flex-shrink-0">
                  <Zap size={13}/> {variantRows.length>0?'Regenerate':'Generate Variants'}
                </Button>
              </div>
            )}

            {variantRows.length>0&&(
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Combination','SKU','Price','Stock','Image','Active',''].map(h=>(
                        <th key={h} className={`px-${h?'2':'3'} py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide ${h===''?'w-8':''} ${h==='Active'?'text-center':''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {variantRows.map((v,i)=>(
                      <VariantRow key={i} variant={v} index={i} currency={currency} onChange={updateVariant} onRemove={removeVariant}/>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>{variantRows.length} variant{variantRows.length!==1?'s':''} · {variantRows.filter(v=>v.isActive!==false).length} active</span>
                  <button type="button" onClick={()=>setVariantRows([])} className="text-red-500 hover:text-red-700 font-semibold">Clear all</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
