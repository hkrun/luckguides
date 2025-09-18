"use client"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Search } from "lucide-react"
import { queryNamingTaskList } from "@/actions/dashboard-logs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function LogsForm() {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<any>()
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(8)
    const [isLoading, setIsLoading] = useState(false)
    const [tasks, setTasks] = useState<any[]>([])
    const [searchValue, setSearchValue] = useState("")
    const [totalTasks, setTotalTasks] = useState(0)
    const [dateRange, setDateRange] = useState({ start: "", end: "" })
    const { toast } = useToast()

    const fetchTasks = async (page: number, perPage: number, email: string, dates: { start: string, end: string }) => {
        setIsLoading(true)
        try {
            const dateRangeString = dates.start && dates.end
            ? `${dates.start}&${dates.end}`
            : ""
            const { tasks: fetchedTasks, total } = await queryNamingTaskList(page, perPage, email, dateRangeString)
            setTasks(fetchedTasks)
            setTotalTasks(total)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch tasks",
                variant: "destructive",
                duration: 3000,
                position: "top-center"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks(currentPage, itemsPerPage, searchValue, dateRange)
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const newPage = 1
        setCurrentPage(newPage)
        fetchTasks(newPage, itemsPerPage, searchValue, dateRange)
    }

    const totalPages = Math.ceil(totalTasks / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage + 1
    const endIndex = Math.min(startIndex + tasks.length - 1, totalTasks)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        fetchTasks(page, itemsPerPage, searchValue, dateRange)
    }

    const handleItemsPerPageChange = (value: string) => {
        const newPerPage = Number.parseInt(value)
        const newPage = 1
        setItemsPerPage(newPerPage)
        setCurrentPage(newPage)
        fetchTasks(newPage, newPerPage, searchValue, dateRange)
    }

    const renderPaginationItems = () => {
        const items = []

        items.push(
            <PaginationItem key="first">
                <PaginationLink isActive={currentPage === 1} onClick={() => handlePageChange(1)}>
                    1
                </PaginationLink>
            </PaginationItem>,
        )

        if (currentPage > 3) {
            items.push(
                <PaginationItem key="ellipsis-1">
                    <PaginationEllipsis />
                </PaginationItem>,
            )
        }

        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (i === 1 || i === totalPages) continue
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink isActive={currentPage === i} onClick={() => handlePageChange(i)}>
                        {i}
                    </PaginationLink>
                </PaginationItem>,
            )
        }

        if (currentPage < totalPages - 2) {
            items.push(
                <PaginationItem key="ellipsis-2">
                    <PaginationEllipsis />
                </PaginationItem>,
            )
        }

        if (totalPages > 1) {
            items.push(
                <PaginationItem key="last">
                    <PaginationLink isActive={currentPage === totalPages} onClick={() => handlePageChange(totalPages)}>
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>,
            )
        }

        return items
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                name="search"
                                type="search"
                                placeholder="Search by email..."
                                className="pl-8 w-full sm:w-[300px]"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <Input
                                type="date"
                                className="w-full"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                placeholder="Start date"
                            />
                            <span className="text-muted-foreground hidden sm:block">to</span>
                            <Input
                                type="date"
                                className="w-full"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                placeholder="End date"
                            />
                        </div>
                        <Button className="w-full sm:w-auto">
                            <Search className="mr-2 h-4 w-4" />
                            Search
                        </Button>
                    </form>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Parameters</TableHead>
                                    <TableHead>Results</TableHead>
                                    <TableHead>IP</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : tasks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            No tasks found. Try adjusting your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tasks.map((task, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{task.fullName || 'N/A'}</span>
                                                    <span className="text-sm text-muted-foreground">{task.emailAddress}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{task.action}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {JSON.stringify(task.params)}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {JSON.stringify(task.result)}
                                            </TableCell>
                                            <TableCell>{task.ip}</TableCell>
                                            <TableCell>{new Date(task.createdAt).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedTask(task)
                                                        setIsDetailsOpen(true)
                                                    }}
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-muted-foreground w-full">
                        <div className="text-center sm:text-left">
                            Showing {startIndex}-{endIndex} of {totalTasks} tasks
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Show</span>
                            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={itemsPerPage} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="8">8</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <span>per page</span>
                        </div>
                    </div>
                    <Pagination>
                        <PaginationContent className="flex-wrap justify-center">
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                    isDisabled={currentPage === 1}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>

                            {renderPaginationItems()}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                    isDisabled={currentPage === totalPages}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </CardFooter>
            </Card>

            {selectedTask && (
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Task Details</DialogTitle>
                            <DialogDescription>View detailed information about this naming task.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="font-semibold">User:</div>
                                <div className="col-span-3">{selectedTask.fullName || 'N/A'}</div>
                                <div className="font-semibold">Email:</div>
                                <div className="col-span-3">{selectedTask.emailAddress}</div>
                                <div className="font-semibold">Action:</div>
                                <div className="col-span-3">{selectedTask.action}</div>
                                <div className="font-semibold">IP Address:</div>
                                <div className="col-span-3">{selectedTask.ip}</div>
                                <div className="font-semibold">Created At:</div>
                                <div className="col-span-3">{new Date(selectedTask.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="grid gap-2">
                                <h3 className="font-semibold">Parameters</h3>
                                <pre className="bg-secondary p-4 rounded-md whitespace-pre-wrap break-all">
                                    {JSON.stringify(selectedTask.params, null, 2)}
                                </pre>
                            </div>
                            <div className="grid gap-2">
                                <h3 className="font-semibold">Results</h3>
                                <pre className="bg-secondary p-4 rounded-md whitespace-pre-wrap break-all">
                                    {JSON.stringify(selectedTask.result, null, 2)}
                                </pre>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}