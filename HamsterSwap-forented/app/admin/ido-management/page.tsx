"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ethers } from "ethers"
import {
  BarChart3,
  Users,
  Calendar,
  Clock,
  Edit,
  Trash2,
  PlusCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Filter,
  Search,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { useWallet } from "@/contexts/wallet-context"
import { useIdoContract } from "@/hooks/use-ido-contract"
import Navbar from "@/components/navbar"

export default function IdoManagementPage() {
  const router = useRouter()
  const { walletState, setIsWalletModalOpen } = useWallet()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("projects")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isWhitelistDialogOpen, setIsWhitelistDialogOpen] = useState(false)
  const [whitelistAddresses, setWhitelistAddresses] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Get IDO contract data
  const {
    idoProjects,
    isLoading,
    refreshData,
    finalizeProject,
    cancelProject,
    addToWhitelist,
    removeFromWhitelist,
    getProjectParticipants,
  } = useIdoContract()

  const [projectParticipants, setProjectParticipants] = useState<Record<number, any[]>>({})

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
      toast({
        title: "Data refreshed",
        description: "The latest IDO information has been loaded.",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Refresh failed",
        description: "Could not refresh IDO data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Filter projects
  const filteredProjects = idoProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || project.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Format number
  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  // Calculate progress
  const calculateProgress = (project: any) => {
    return (project.totalRaised / project.hardCap) * 100
  }

  // Load project participants
  const loadProjectParticipants = async (projectId: number) => {
    if (!walletState.connected || !walletState.provider) return

    try {
      const participants = await getProjectParticipants(projectId)
      setProjectParticipants((prev) => ({
        ...prev,
        [projectId]: participants,
      }))
    } catch (error) {
      console.error(`Error loading participants for project ${projectId}:`, error)
      toast({
        title: "Failed to load participants",
        description: "Could not load project participants. Please try again.",
        variant: "destructive",
      })
    }
  }

  // View project details
  const handleViewProject = (project: any) => {
    setSelectedProject(project)
    loadProjectParticipants(project.id)
  }

  // Handle finalize project
  const handleFinalizeProject = async () => {
    if (!selectedProject) return

    setIsProcessing(true)
    try {
      await finalizeProject(selectedProject.id)
      toast({
        title: "Project finalized",
        description: `${selectedProject.name} has been successfully finalized.`,
      })
      refreshData()
    } catch (error) {
      console.error("Error finalizing project:", error)
      toast({
        title: "Failed to finalize project",
        description: "Could not finalize the project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle cancel project
  const handleCancelProject = async () => {
    if (!selectedProject) return

    setIsProcessing(true)
    try {
      await cancelProject(selectedProject.id)
      toast({
        title: "Project cancelled",
        description: `${selectedProject.name} has been cancelled.`,
      })
      setIsDeleteDialogOpen(false)
      refreshData()
    } catch (error) {
      console.error("Error cancelling project:", error)
      toast({
        title: "Failed to cancel project",
        description: "Could not cancel the project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle whitelist management
  const handleWhitelistManagement = async (action: "add" | "remove") => {
    if (!selectedProject) return

    setIsProcessing(true)
    try {
      const addresses = whitelistAddresses
        .split(/[\n,]/)
        .map((addr) => addr.trim())
        .filter((addr) => ethers.utils.isAddress(addr))

      if (addresses.length === 0) {
        throw new Error("No valid addresses provided")
      }

      if (action === "add") {
        await addToWhitelist(selectedProject.id, addresses)
        toast({
          title: "Addresses whitelisted",
          description: `${addresses.length} addresses have been added to the whitelist.`,
        })
      } else {
        await removeFromWhitelist(selectedProject.id, addresses)
        toast({
          title: "Addresses removed",
          description: `${addresses.length} addresses have been removed from the whitelist.`,
        })
      }

      setWhitelistAddresses("")
      setIsWhitelistDialogOpen(false)
    } catch (error) {
      console.error("Error managing whitelist:", error)
      toast({
        title: "Whitelist operation failed",
        description: error instanceof Error ? error.message : "Could not update the whitelist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Upcoming
          </Badge>
        )
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Active
          </Badge>
        )
      case "ended":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            Ended
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Check if wallet is connected
  if (!walletState.connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA] font-sans pb-20">
        <Navbar />
        <main className="container mx-auto px-4 pt-32">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#523805] to-[#987A3F] mb-4">
                IDO Management
              </h1>
              <p className="text-lg text-[#523805]/80 max-w-2xl mx-auto">Connect your wallet to manage IDO projects.</p>
            </div>

            <Card className="border-[#EACC91] shadow-md">
              <CardHeader>
                <CardTitle className="text-[#523805]">Connect Wallet</CardTitle>
                <CardDescription>You need to connect your wallet to access the IDO management panel.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                  onClick={() => setIsWalletModalOpen(true)}
                >
                  Connect Wallet
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA] font-sans pb-20">
      <Navbar />

      <main className="container mx-auto px-4 pt-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#523805] to-[#987A3F]">
                IDO Management
              </h1>
              <p className="text-[#523805]/70">Manage your IDO projects and participants</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Button
                className="bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                onClick={() => router.push("/admin/create-ido")}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New IDO
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-[#EACC91] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#523805]">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-[#523805]">{idoProjects.length}</div>
                  <BarChart3 className="h-8 w-8 text-[#987A3F]" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#523805]">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-[#523805]">
                    {idoProjects.filter((p) => p.status === "active").length}
                  </div>
                  <Calendar className="h-8 w-8 text-[#987A3F]" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#523805]">Total Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-[#523805]">
                    {Object.values(projectParticipants).reduce((acc, curr) => acc + curr.length, 0)}
                  </div>
                  <Users className="h-8 w-8 text-[#987A3F]" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="projects" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="bg-[#EACC91]/30 p-1 rounded-xl mb-6">
              <TabsTrigger
                value="projects"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
              >
                Projects
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
              >
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-0">
              <Card className="border-[#EACC91] shadow-md">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <CardTitle className="text-xl text-[#523805]">IDO Projects</CardTitle>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#523805]/50" />
                        <Input
                          placeholder="Search projects..."
                          className="pl-10 border-[#EACC91] text-[#523805] rounded-lg"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="border-[#EACC91] text-[#523805]">
                            <Filter className="h-4 w-4 mr-2" />
                            {statusFilter === "all"
                              ? "All Status"
                              : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="border-[#EACC91]">
                          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("upcoming")}>Upcoming</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("active")}>Active</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("ended")}>Ended</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>Cancelled</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#987A3F]"></div>
                    </div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="bg-[#F9F5EA] rounded-2xl p-8 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-3 bg-[#EACC91]/30 rounded-full">
                          <Info className="h-8 w-8 text-[#523805]/50" />
                        </div>
                        <h3 className="text-xl font-bold text-[#523805]">No IDO Projects Found</h3>
                        <p className="text-[#523805]/70">
                          No IDO projects match your search criteria or there are no projects available.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[#523805]">Project</TableHead>
                            <TableHead className="text-[#523805]">Status</TableHead>
                            <TableHead className="text-[#523805]">Timeline</TableHead>
                            <TableHead className="text-[#523805]">Progress</TableHead>
                            <TableHead className="text-[#523805]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProjects.map((project) => (
                            <TableRow key={project.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full overflow-hidden border border-[#EACC91]">
                                    <Image
                                      src={project.tokenLogo || "/placeholder.svg"}
                                      alt={project.name}
                                      width={40}
                                      height={40}
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <div className="font-medium text-[#523805]">{project.name}</div>
                                    <div className="text-sm text-[#523805]/70">{project.tokenSymbol}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(project.status)}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <div className="text-sm text-[#523805]/70 flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" /> {formatDate(project.startTime)}
                                  </div>
                                  <div className="text-sm text-[#523805]/70 flex items-center">
                                    <Clock className="h-3 w-3 mr-1" /> {formatDate(project.endTime)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="w-full max-w-[200px]">
                                  <div className="flex justify-between text-xs text-[#523805]/70 mb-1">
                                    <span>{formatNumber(project.totalRaised)} CAKE</span>
                                    <span>{formatNumber(project.hardCap)} CAKE</span>
                                  </div>
                                  <Progress
                                    value={calculateProgress(project)}
                                    className="h-2 bg-[#EACC91]/30"
                                    indicatorClassName="bg-gradient-to-r from-[#EACC91] to-[#987A3F]"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8 border-[#EACC91] text-[#523805]"
                                          onClick={() => handleViewProject(project)}
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>View Details</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8 border-[#EACC91] text-[#523805]"
                                          onClick={() => router.push(`/admin/edit-ido/${project.id}`)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Edit Project</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8 border-[#EACC91] text-red-500"
                                          onClick={() => {
                                            setSelectedProject(project)
                                            setIsDeleteDialogOpen(true)
                                          }}
                                          disabled={project.status === "cancelled"}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Cancel Project</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <Card className="border-[#EACC91] shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl text-[#523805]">IDO Analytics</CardTitle>
                  <CardDescription>Overview of your IDO platform performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#F9F5EA] rounded-xl p-6 border border-[#EACC91]/40">
                      <h3 className="text-lg font-medium text-[#523805] mb-4">Project Status Distribution</h3>
                      <div className="space-y-4">
                        {["upcoming", "active", "ended", "cancelled"].map((status) => {
                          const count = idoProjects.filter((p) => p.status === status).length
                          const percentage = idoProjects.length > 0 ? (count / idoProjects.length) * 100 : 0

                          return (
                            <div key={status}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-[#523805] capitalize">{status}</span>
                                <span className="text-sm text-[#523805]/70">
                                  {count} projects ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <Progress
                                value={percentage}
                                className="h-2 bg-[#EACC91]/30"
                                indicatorClassName={
                                  status === "upcoming"
                                    ? "bg-blue-500"
                                    : status === "active"
                                      ? "bg-green-500"
                                      : status === "ended"
                                        ? "bg-gray-500"
                                        : "bg-red-500"
                                }
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="bg-[#F9F5EA] rounded-xl p-6 border border-[#EACC91]/40">
                      <h3 className="text-lg font-medium text-[#523805] mb-4">Fundraising Overview</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-[#523805]/70">Total Raised</span>
                          <span className="font-medium text-[#523805]">
                            {formatNumber(idoProjects.reduce((acc, p) => acc + p.totalRaised, 0))} CAKE
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#523805]/70">Average Raised per Project</span>
                          <span className="font-medium text-[#523805]">
                            {idoProjects.length > 0
                              ? formatNumber(
                                  idoProjects.reduce((acc, p) => acc + p.totalRaised, 0) / idoProjects.length,
                                )
                              : "0"}{" "}
                            CAKE
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#523805]/70">Highest Raised</span>
                          <span className="font-medium text-[#523805]">
                            {idoProjects.length > 0
                              ? formatNumber(Math.max(...idoProjects.map((p) => p.totalRaised)))
                              : "0"}{" "}
                            CAKE
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#523805]/70">Success Rate</span>
                          <span className="font-medium text-[#523805]">
                            {idoProjects.length > 0
                              ? (
                                  (idoProjects.filter((p) => p.totalRaised >= p.softCap).length / idoProjects.length) *
                                  100
                                ).toFixed(1)
                              : "0"}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Project Details Dialog */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
          <DialogContent className="max-w-4xl border-[#EACC91]">
            <DialogHeader>
              <DialogTitle className="text-[#523805] flex items-center gap-3">
                <div className="h-8 w-8 rounded-full overflow-hidden border border-[#EACC91]">
                  <Image
                    src={selectedProject.tokenLogo || "/placeholder.svg"}
                    alt={selectedProject.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
                {selectedProject.name} ({selectedProject.tokenSymbol})
              </DialogTitle>
              <DialogDescription>
                Project ID: {selectedProject.id} • {getStatusBadge(selectedProject.status)}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details">
              <TabsList className="bg-[#EACC91]/30 p-1 rounded-xl mb-4">
                <TabsTrigger
                  value="details"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="participants"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                >
                  Participants
                </TabsTrigger>
                <TabsTrigger
                  value="whitelist"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                >
                  Whitelist
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-[#523805] mb-3">Project Information</h3>
                    <div className="bg-[#F9F5EA] rounded-xl p-4 border border-[#EACC91]/40 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#523805]/70">Token Address</span>
                        <span className="font-medium text-[#523805] text-sm truncate max-w-[200px]">
                          {selectedProject.tokenAddress || "0x..."}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#523805]/70">Token Price</span>
                        <span className="font-medium text-[#523805]">
                          {formatNumber(selectedProject.price, 4)} CAKE
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#523805]/70">Start Time</span>
                        <span className="font-medium text-[#523805]">{formatDate(selectedProject.startTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#523805]/70">End Time</span>
                        <span className="font-medium text-[#523805]">{formatDate(selectedProject.endTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#523805]/70">Allocation Range</span>
                        <span className="font-medium text-[#523805]">
                          {formatNumber(selectedProject.minAllocation)} - {formatNumber(selectedProject.maxAllocation)}{" "}
                          CAKE
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-[#523805] mb-3">Fundraising Status</h3>
                    <div className="bg-[#F9F5EA] rounded-xl p-4 border border-[#EACC91]/40 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#523805]/70">Soft Cap</span>
                        <span className="font-medium text-[#523805]">{formatNumber(selectedProject.softCap)} CAKE</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#523805]/70">Hard Cap</span>
                        <span className="font-medium text-[#523805]">{formatNumber(selectedProject.hardCap)} CAKE</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#523805]/70">Total Raised</span>
                        <span className="font-medium text-[#523805]">
                          {formatNumber(selectedProject.totalRaised)} CAKE
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#523805]/70">Progress</span>
                        <span className="font-medium text-[#523805]">
                          {calculateProgress(selectedProject).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <Progress
                          value={calculateProgress(selectedProject)}
                          className="h-2 bg-[#EACC91]/30"
                          indicatorClassName="bg-gradient-to-r from-[#EACC91] to-[#987A3F]"
                        />
                      </div>
                    </div>

                    {selectedProject.status === "ended" && (
                      <Button
                        className="w-full mt-4 bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                        onClick={handleFinalizeProject}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-[#523805] rounded-full"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Finalize Project
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="participants">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-[#523805]">Project Participants</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#EACC91] text-[#523805]"
                      onClick={() => loadProjectParticipants(selectedProject.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  {!projectParticipants[selectedProject.id] ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#987A3F]"></div>
                    </div>
                  ) : projectParticipants[selectedProject.id].length === 0 ? (
                    <div className="bg-[#F9F5EA] rounded-xl p-6 border border-[#EACC91]/40 text-center">
                      <Info className="h-8 w-8 mx-auto text-[#523805]/50 mb-2" />
                      <p className="text-[#523805]">No participants found for this project.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[#523805]">Address</TableHead>
                            <TableHead className="text-[#523805]">Amount</TableHead>
                            <TableHead className="text-[#523805]">Token Allocation</TableHead>
                            <TableHead className="text-[#523805]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectParticipants[selectedProject.id].map((participant, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-sm text-[#523805]/70">
                                {participant.address.substring(0, 6)}...{participant.address.substring(38)}
                              </TableCell>
                              <TableCell>{formatNumber(Number(participant.amount))} CAKE</TableCell>
                              <TableCell>
                                {formatNumber(Number(participant.amount) / selectedProject.price)}{" "}
                                {selectedProject.tokenSymbol}
                              </TableCell>
                              <TableCell>
                                {participant.claimed ? (
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                    Claimed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="whitelist">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-[#523805]">Whitelist Management</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#EACC91] text-[#523805]"
                      onClick={() => setIsWhitelistDialogOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Manage Whitelist
                    </Button>
                  </div>

                  <div className="bg-[#F9F5EA] rounded-xl p-4 border border-[#EACC91]/40">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-[#523805] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#523805] mb-1">Whitelist Information</p>
                        <p className="text-xs text-[#523805]/80">
                          Only whitelisted addresses can participate in this IDO. You can add or remove addresses from
                          the whitelist.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Whitelist addresses would be displayed here */}
                  <div className="bg-white rounded-xl p-4 border border-[#EACC91]">
                    <p className="text-center text-[#523805]/70">
                      Use the "Manage Whitelist" button to add or remove addresses from the whitelist.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedProject(null)}
                className="border-[#EACC91] text-[#523805]"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel Project Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-[#EACC91]">
          <DialogHeader>
            <DialogTitle className="text-[#523805]">Cancel Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200 mb-4">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Warning</p>
                <p className="text-xs text-red-600">
                  Cancelling this project will allow participants to request refunds. All project data will be preserved
                  but the project will be marked as cancelled.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-[#EACC91] text-[#523805]"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCancelProject} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                  Processing...
                </>
              ) : (
                "Confirm Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Whitelist Management Dialog */}
      <Dialog open={isWhitelistDialogOpen} onOpenChange={setIsWhitelistDialogOpen}>
        <DialogContent className="border-[#EACC91]">
          <DialogHeader>
            <DialogTitle className="text-[#523805]">Manage Whitelist</DialogTitle>
            <DialogDescription>Add or remove addresses from the whitelist for this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="whitelistAddresses" className="text-sm font-medium text-[#523805]">
                Addresses (one per line or comma separated)
              </label>
              <textarea
                id="whitelistAddresses"
                value={whitelistAddresses}
                onChange={(e) => setWhitelistAddresses(e.target.value)}
                className="w-full min-h-[150px] p-3 rounded-md border border-[#EACC91] text-[#523805] bg-white"
                placeholder="0x..."
              />
            </div>
            <div className="bg-[#F9F5EA] rounded-xl p-4 border border-[#EACC91]/40">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-[#523805] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-[#523805]/80">
                    Enter Ethereum addresses to add or remove from the whitelist. Each address should be on a new line
                    or separated by commas.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsWhitelistDialogOpen(false)}
              className="border-[#EACC91] text-[#523805]"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleWhitelistManagement("remove")}
                className="border-red-200 text-red-600 hover:bg-red-50"
                disabled={isProcessing || !whitelistAddresses.trim()}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-red-600 rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  "Remove from Whitelist"
                )}
              </Button>
              <Button
                onClick={() => handleWhitelistManagement("add")}
                className="bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                disabled={isProcessing || !whitelistAddresses.trim()}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-[#523805] rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  "Add to Whitelist"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
