"use client"
import { useState, useCallback, useEffect } from "react"
import {
    Edit,
    Search,
    Coins
} from "lucide-react"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { getUsers, updateUser } from "@/actions/dashboard-users"
import { type DashboardUser } from "@/types/dashboard-user"

export function UsersForm() {
    const [isEditUserOpen, setIsEditUserOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<DashboardUser>()
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(8)
    const [isLoading, setIsLoading] = useState(false)
    const [users, setUsers] = useState<DashboardUser[]>([])
    const [searchValue, setSearchValue] = useState("")
    const [totalUsers, setTotalUsers] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const [editStatus, setEditStatus] = useState<string>("")
    const [editCredits, setEditCredits] = useState<string>("")
    const { toast } = useToast()

    const fetchUsers = async (page: number, perPage: number, search: string) => {
        setIsLoading(true)
        try {
            const { users: fetchedUsers, total } = await getUsers(search, page, perPage)
            setUsers(fetchedUsers)
            setTotalUsers(total)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch users",
                variant: "destructive",
                duration: 3000,
                position: "top-center"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers(currentPage, itemsPerPage, searchValue)
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const newPage = 1
        setCurrentPage(newPage)
        fetchUsers(newPage, itemsPerPage, searchValue)
    }

    const handleEditUser = async () => {
        if (!selectedUser) return
        setIsSaving(true)
    
        try {
            
            await updateUser(selectedUser.user_id, {
                credits: parseInt(editCredits),
                status: editStatus === "Active" ? "1" : "0"
            })
    
            toast({
                title: "User updated",
                description: `${selectedUser.name}'s information has been updated.`,
                duration: 3000,
                position: "top-center"
            })
    
            fetchUsers(currentPage, itemsPerPage, searchValue)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update user",
                variant: "destructive",
                duration: 3000,
                position: "top-center"
            })
        } finally {
            setIsSaving(false)
            setIsEditUserOpen(false)
        }
    }

    const totalPages = Math.ceil(totalUsers / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage + 1
    const endIndex = Math.min(startIndex + users.length - 1, totalUsers)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        fetchUsers(page, itemsPerPage, searchValue);
    }

    const handleItemsPerPageChange = (value: string) => {
        const newPerPage = Number.parseInt(value)
        const newPage = 1
        setItemsPerPage(newPerPage)
        setCurrentPage(newPage)
        fetchUsers(newPage, newPerPage, searchValue)
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Active":
                return "bg-green-500"
            case "Inactive":
                return "bg-yellow-500"
            case "Suspended":
                return "bg-red-500"
            default:
                return "bg-gray-500"
        }
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
                                placeholder="Search users..."
                                className="pl-8 w-full sm:w-[300px]"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
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
                                    <TableHead>ID</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            No users found. Try adjusting your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="whitespace-nowrap">{user.user_id}</TableCell>
                                            <TableCell className="font-medium min-w-[200px]">
                                                <div className="flex items-center space-x-3">
                                                    <Avatar className="h-9 w-9 flex-shrink-0">
                                                        <AvatarFallback>
                                                            {user.name.charAt(0)}
                                                            {user.name.split(" ")[1]?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <div className="font-medium truncate">{user.name}</div>
                                                        <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Coins className="h-4 w-4 text-primary-gold" />
                                                    <span className="font-medium">{user.credits}</span>
                                                    <span className="text-sm text-muted-foreground">credits</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <div className={`h-2 w-2 rounded-full ${getStatusColor(user.status)}`} />
                                                    <span>{user.status}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setIsEditUserOpen(true)
                                                    }}
                                                    variant="ghost"
                                                    size="icon"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">Edit user</span>
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
                            Showing {startIndex}-{endIndex} of {totalUsers} users
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

            {selectedUser && (
                <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>Make changes to {selectedUser.name}'s profile.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input id="edit-name" defaultValue={selectedUser.name} disabled />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input id="edit-email" type="email" defaultValue={selectedUser.email} disabled />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-credits">Credits</Label>
                                <Input id="edit-credits" type="number" 
                                onChange={(e) => setEditCredits(e.target.value)}
                                defaultValue={selectedUser.credits} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select 
                                    onValueChange={(value) => setEditStatus(value)}
                                    defaultValue={selectedUser.status}>
                                    <SelectTrigger id="edit-status">
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditUserOpen(false)} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditUser} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}

