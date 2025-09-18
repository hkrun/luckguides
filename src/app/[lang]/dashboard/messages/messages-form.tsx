"use client"
import { useState, useEffect } from "react"
import { Search, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { queryContactList } from "@/actions/dashboard-messages"
import { type Contact } from "@/types/contact"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function MessagesForm() {
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(8)
    const [isLoading, setIsLoading] = useState(false)
    const [messages, setMessages] = useState<Contact[]>([])
    const [searchValue, setSearchValue] = useState("")
    const [totalMessages, setTotalMessages] = useState(0)
    const [dateRange, setDateRange] = useState({ start: "", end: "" })
    const { toast } = useToast()

    const fetchMessages = async (page: number, perPage: number, search: string, dates: { start: string, end: string }) => {
        setIsLoading(true)
        try {
            const dateRangeString = dates.start && dates.end
                ? `${dates.start}&${dates.end}`
                : ""
            const { contacts, total } = await queryContactList(
                page,
                perPage,
                search,
                dateRangeString
            )
            setMessages(contacts)
            setTotalMessages(total)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch messages",
                variant: "destructive",
                duration: 3000,
                position: "top-center"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchMessages(currentPage, itemsPerPage, searchValue, dateRange)
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const newPage = 1
        setCurrentPage(newPage)
        fetchMessages(newPage, itemsPerPage, searchValue, dateRange)
    }

    const totalPages = Math.ceil(totalMessages / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage + 1
    const endIndex = Math.min(startIndex + messages.length - 1, totalMessages)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        fetchMessages(page, itemsPerPage, searchValue, dateRange)
    }

    const handleItemsPerPageChange = (value: string) => {
        const newPerPage = Number.parseInt(value)
        const newPage = 1
        setItemsPerPage(newPerPage)
        setCurrentPage(newPage)
        fetchMessages(newPage, newPerPage, searchValue, dateRange)
    }

    const renderPaginationItems = () => {
        const items = []

        items.push(
            <PaginationItem key="first">
                <PaginationLink isActive={currentPage === 1} onClick={() => handlePageChange(1)}>
                    1
                </PaginationLink>
            </PaginationItem>
        )

        if (currentPage > 3) {
            items.push(
                <PaginationItem key="ellipsis-1">
                    <PaginationEllipsis />
                </PaginationItem>
            )
        }

        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (i === 1 || i === totalPages) continue
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink isActive={currentPage === i} onClick={() => handlePageChange(i)}>
                        {i}
                    </PaginationLink>
                </PaginationItem>
            )
        }

        if (currentPage < totalPages - 2) {
            items.push(
                <PaginationItem key="ellipsis-2">
                    <PaginationEllipsis />
                </PaginationItem>
            )
        }

        if (totalPages > 1) {
            items.push(
                <PaginationItem key="last">
                    <PaginationLink isActive={currentPage === totalPages} onClick={() => handlePageChange(totalPages)}>
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            )
        }

        return items
    }

    return (
        <Card>
            <CardHeader className="flex flex-col space-y-4 pb-2">
                <form onSubmit={handleSearch} className="flex flex-col space-y-4 w-full">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                name="search"
                                type="search"
                                placeholder="Search by email or name..."
                                className="pl-8 w-full"
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
                    </div>
                </form>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : messages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8">
                                        No messages found. Try adjusting your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                messages.map((message, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium min-w-[200px]">
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="h-9 w-9 flex-shrink-0">
                                                    <AvatarFallback>
                                                        {message.fullName.charAt(0)}
                                                        {message.fullName.split(" ")[1]?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <div className="font-medium truncate">{message.fullName}</div>
                                                    <div className="text-sm text-muted-foreground truncate">{message.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <MessageSquare className="h-4 w-4" />
                                                <span className="line-clamp-2">{message.message}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{new Date(message.createdAt).toLocaleString()}</TableCell>
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
                        Showing {startIndex}-{endIndex} of {totalMessages} messages
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
    )
}