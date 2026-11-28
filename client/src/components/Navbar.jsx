
import { useEffect, useState } from 'react'
import { SearchIcon, PanelLeft, MoonIcon, SunIcon, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../features/themeSlice'
import { UserButton, useAuth } from '@clerk/react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Navbar = ({ setIsSidebarOpen }) => {

    const dispatch = useDispatch()
    const { theme } = useSelector(state => state.theme)
    const navigate = useNavigate()
    const { getToken } = useAuth()

    const [query, setQuery] = useState('')
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(false)
    const [showResults, setShowResults] = useState(false)

    // Search projects
    useEffect(() => {
        if (!query.trim()) {
            setProjects([])
            setShowResults(false)
            setLoading(false)
            return
        }

        let active = true

        const timer = setTimeout(async () => {
            try {
                setLoading(true)

                const token = await getToken()

                const { data } = await axios.get(
                    `${import.meta.env.VITE_BASEURL}/api/projects/search`,
                    {
                        params: { query: query.trim() },
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )

                if (active) {
                    setProjects(data.projects || [])
                    setShowResults(true)
                }

            } catch (error) {
                console.error('Project search error:', error)

                if (active) {
                    setProjects([])
                    setShowResults(true)
                }

            } finally {
                if (active) setLoading(false)
            }
        }, 400)

        return () => {
            active = false
            clearTimeout(timer)
        }

    }, [query, getToken])

    // Open project
    const handleProjectClick = (projectId) => {
        setQuery('')
        setProjects([])
        setShowResults(false)

        navigate(`/projects/${projectId}`)
    }

    const clearSearch = () => {
        setQuery('')
        setProjects([])
        setShowResults(false)
    }

    return (
        <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 xl:px-16 py-3 flex-shrink-0">

            <div className="flex items-center justify-between max-w-6xl mx-auto">

                {/* Left section */}
                <div className="flex items-center gap-4 min-w-0 flex-1">

                    {/* Sidebar Trigger */}
                    <button
                        onClick={() => setIsSidebarOpen(prev => !prev)}
                        className="sm:hidden p-2 rounded-lg transition-colors text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
                    >
                        <PanelLeft size={20} />
                    </button>

                    {/* Search Input */}
                    <div className="relative flex-1 max-w-sm">

                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 size-3.5" />

                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => {
                                if (query.trim()) setShowResults(true)
                            }}
                            placeholder="Search projects..."
                            className="pl-8 pr-9 py-2 w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                        />

                        {query && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            >
                                <X size={15} />
                            </button>
                        )}

                        {/* Search Results */}
                        {showResults && (
                            <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">

                                <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800">
                                    <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                                        PROJECT RESULTS
                                    </p>
                                </div>

                                <div className="max-h-72 overflow-y-auto">

                                    {loading ? (
                                        <p className="p-4 text-sm text-gray-500 text-center">
                                            Searching projects...
                                        </p>
                                    ) : projects.length > 0 ? (

                                        projects.map(project => (
                                            <button
                                                key={project.id}
                                                onClick={() => handleProjectClick(project.id)}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800 last:border-0 transition"
                                            >
                                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                                    {project.name}
                                                </p>

                                                {project.description && (
                                                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-1">
                                                        {project.description}
                                                    </p>
                                                )}
                                            </button>
                                        ))

                                    ) : (
                                        <p className="p-4 text-sm text-gray-500 dark:text-zinc-400 text-center">
                                            No projects found
                                        </p>
                                    )}

                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-3">

                    {/* Theme Toggle */}
                    <button
                        onClick={() => dispatch(toggleTheme())}
                        className="size-8 flex items-center justify-center bg-white dark:bg-zinc-800 shadow rounded-lg transition hover:scale-105 active:scale-95"
                    >
                        {theme === "light"
                            ? <MoonIcon className="size-4 text-gray-800" />
                            : <SunIcon className="size-4 text-yellow-400" />
                        }
                    </button>

                    {/* User Button */}
                    <UserButton />

                </div>
            </div>
        </div>
    )
}

export default Navbar
