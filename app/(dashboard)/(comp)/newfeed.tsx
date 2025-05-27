"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Dummy news data
const engineeringNews = [
  {
    id: 1,
    title:
      "New Carbon-Fiber Composite Shows Promise for Aerospace Applications",
    summary:
      "Researchers develop a revolutionary carbon-fiber composite material that offers 40% more strength with 25% less weight than current aerospace standards.",
    image: "./Carbon.jpeg",
    category: "Materials",
    date: "Mar 10, 2025",
    readTime: "5 min read",
    featured: true,
    author: {
      name: "Dr. Emily Chen",
      avatar: "./Author.jpeg",
      role: "Materials Scientist",
    },
  },
  {
    id: 2,
    title: "Quantum Computing Breakthrough Enables Stable 128-Qubit Processing",
    summary:
      "IBM engineers announce significant progress in quantum error correction, achieving stable operations at 128 qubits for the first time.",
    image: "/Quantum.jpeg",
    category: "Computing",
    date: "Mar 9, 2025",
    readTime: "8 min read",
    featured: true,
    author: {
      name: "James Wilson",
      avatar: "./Author.jpeg",
      role: "Quantum Engineer",
    },
  },
  {
    id: 3,
    title:
      "Self-Healing Concrete Could Revolutionize Infrastructure Maintenance",
    summary:
      "Civil engineers develop bacteria-infused concrete that can automatically repair cracks, potentially extending infrastructure lifespans by decades.",
    image: "/Heal.jpeg",
    category: "Civil",
    date: "Mar 8, 2025",
    readTime: "4 min read",
    featured: false,
    author: {
      name: "Dr. Michael Rodriguez",
      avatar: "./Author.jpeg",
      role: "Civil Engineer",
    },
  },
  {
    id: 4,
    title:
      "Neural Implant Enables Direct Brain-Computer Interface for Paralyzed Patients",
    summary:
      "Biomedical engineering team successfully tests a new neural implant that allows patients with paralysis to control digital devices with their thoughts.",
    image: "/Neural.jpeg",
    category: "Biomedical",
    date: "Mar 7, 2025",
    readTime: "6 min read",
    featured: false,
    author: {
      name: "Dr. Sarah Johnson",
      avatar: "./Author.jpeg",
      role: "Biomedical Engineer",
    },
  },
  {
    id: 5,
    title: "Breakthrough in Nuclear Fusion Brings Clean Energy One Step Closer",
    summary:
      "Engineers at ITER achieve landmark sustained fusion reaction that produces more energy than it consumes, marking a critical milestone for clean energy.",
    image: "/Nuclear.jpeg",
    category: "Energy",
    date: "Mar 6, 2025",
    readTime: "7 min read",
    featured: false,
    author: {
      name: "Prof. Robert Lee",
      avatar: "./Author.jpeg",
      role: "Nuclear Engineer",
    },
  },
  {
    id: 6,
    title: "Novel Desalination Method Uses 75% Less Energy",
    summary:
      "Chemical engineers develop an innovative membrane technology that dramatically reduces the energy requirements for seawater desalination.",
    image: "/Novel.jpeg",
    category: "Chemical",
    date: "Mar 5, 2025",
    readTime: "5 min read",
    featured: false,
    author: {
      name: "Dr. Aisha Patel",
      avatar: "./Author.jpeg",
      role: "Chemical Engineer",
    },
  },
  {
    id: 7,
    title: "Autonomous Construction Robots Complete First Commercial Building",
    summary:
      "A fleet of autonomous robots successfully completes construction of a commercial office building with minimal human intervention, setting new industry standards.",
    image: "/Auto.jpeg",
    category: "Robotics",
    date: "Mar 4, 2025",
    readTime: "6 min read",
    featured: false,
    author: {
      name: "Thomas Kim",
      avatar: "./Author.jpeg",
      role: "Robotics Engineer",
    },
  },
  {
    id: 8,
    title: "5G-Enabled IoT Network Monitors City Infrastructure in Real-Time",
    summary:
      "Electrical engineers deploy comprehensive sensor network throughout Seattle that monitors structural integrity, traffic flow, and utility performance in real-time.",
    image: "/5G.jpeg",
    category: "Electrical",
    date: "Mar 3, 2025",
    readTime: "4 min read",
    featured: false,
    author: {
      name: "Lisa Martinez",
      avatar: "./Author.jpeg",
      role: "Electrical Engineer",
    },
  },
];

const categories = [
  "All",
  "Materials",
  "Computing",
  "Civil",
  "Biomedical",
  "Energy",
  "Chemical",
  "Robotics",
  "Electrical",
];

function EngineeringNewsFeed() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNews = engineeringNews.filter((news) => {
    // Filter by category
    const categoryMatch =
      activeCategory === "All" || news.category === activeCategory;

    // Filter by search query
    const searchMatch =
      news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.summary.toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const featuredNews = filteredNews.filter((news) => news.featured);
  const regularNews = filteredNews.filter((news) => !news.featured);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Engineering Daily
              </h1>
              <p className="text-sm text-slate-500">
                Stay updated with the latest breakthroughs in engineering
              </p>
            </div>

            <div className="w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-md w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Category Tabs */}
        <div className="overflow-x-auto pb-4">
          <Tabs defaultValue="All" className="w-full">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  onClick={() => setActiveCategory(category)}
                  className="px-4 py-2 text-sm"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Featured Articles */}
        {featuredNews.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">
              Featured Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredNews.map((news) => (
                <Card
                  key={news.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-56 object-fill"
                    />
                    <Badge className="absolute top-4 left-4 bg-blue-500 hover:bg-blue-600">
                      {news.category}
                    </Badge>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold mb-2 text-slate-900">
                      {news.title}
                    </h3>
                    <p className="text-slate-600 mb-4">{news.summary}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={news.author.avatar}
                          alt={news.author.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {news.author.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {news.author.role}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {news.date} • {news.readTime}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Latest Articles */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            Latest Updates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularNews.map((news) => (
              <Card
                key={news.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-40 object-cover"
                  />
                  <Badge className="absolute top-3 left-3 bg-blue-500 hover:bg-blue-600 text-xs">
                    {news.category}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2 text-slate-900 line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                    {news.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={news.author.avatar}
                        alt={news.author.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <p className="text-xs font-medium text-slate-900">
                        {news.author.name}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500">{news.date}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredNews.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v10m2 2h-2v-2m0 0V8m0 8h-8m0 0H5"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-slate-900">
              No articles found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your search or filter to find what you're looking
              for.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Newsletter */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6 md:p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
              Stay at the Cutting Edge
            </h3>
            <p className="text-slate-600 mb-6">
              Subscribe to our weekly newsletter and never miss the latest in
              engineering innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow px-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EngineeringNewsFeed;
