import { BrainCircuit } from "lucide-react"

export default function Logo(){
return(
<div className="flex items-center gap-2 text-2xl font-bold">
<BrainCircuit size={32} className="text-purple-400"/>
<span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
SensAI
</span>
</div>
)
}