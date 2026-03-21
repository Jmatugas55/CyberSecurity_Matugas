import { useEffect, useState } from "react"
import { getUsers } from "../api/api"

export default function Users() {

  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {

    try {

      const res = await getUsers()
      setUsers(res.data)

    } catch (err) {
      console.log(err)
    }

  }
  return (
    <div className="p-10">

      <h1 className="text-2xl font-bold mb-5">
        Users List
      </h1>

      {users.map(user => (
        <div key={user.id} className="p-2 border mb-2">
          {user.email}
        </div>
      ))}

    </div>
  )
}