import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { Dashboard } from "@/pages/Dashboard"
import { Calls } from "@/pages/Calls"
import { CallDetail } from "@/pages/CallDetail"
import { Callbacks } from "@/pages/Callbacks"
import { Messages } from "@/pages/Messages"
import { Search } from "@/pages/Search"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/calls/:callSid" element={<CallDetail />} />
          <Route path="/callbacks" element={<Callbacks />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/search" element={<Search />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
