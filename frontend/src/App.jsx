import { Route, Routes } from "react-router"
import ChatPage from "./pages/ChatPage"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import { useAuthStroe } from "./store/useAuthStore"

function App() {
  const { authUser, isLoggedIn, login } = useAuthStroe();

  console.log("auth user: ", authUser);
  console.log('isLoggedIn: ', isLoggedIn);
  return (
    <div className="min-h-screen bg-slate-900 relative flex items-centerjustify-center p-4 overflow-hidden">
      {/* Decorators - Grid BG & Glow Shapes */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute top-0 -left-4 size-96 bg-pink-500 opacity-20 blur-[100px]" />
      <div className="absolute bottom-0 -right-4 size-96 bg-cyan-500 opacity-20 blur-[100px]" />

      <button onClick={login} className="z-10">login</button>
      <Routes>
        <Route path="/" element={<ChatPage />}></Route>
        <Route path="/login" element={<LoginPage />}></Route>
        <Route path="/signup" element={<SignUpPage />}></Route>
      </Routes>
    </div>
  )
}

export default App
