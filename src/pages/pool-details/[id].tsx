import React, { useState, useEffect } from "react";

import Head from "next/head";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import ProjectDetails from "@/components/marketplace/ProjectDetails";
import KronosCustomerService from "@/services/KronosCustomerService";

const PoolDetailsPage = () => {
  const params = useParams();
  const id = params?.id;
  const [selectedProject, setSelectedProject] = useState<Parse.Object<Project> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPoolDetails = async () => {
      try {
        const response = await KronosCustomerService.getProjectsByIds([id as string]);
        setSelectedProject(response?.[0] || null); // Extract first project or set to null
      } catch (error) {
        console.error("Error fetching pool data:", error);
      }
    };

    if (id) {
      fetchPoolDetails();
    }
  }, [id]);

  return (
    <>
      <Head>
        <title>Pool Details - Customer Portal</title>
      </Head>
      <div className="project-details">
        {selectedProject && selectedProject.id ? (
          <ProjectDetails project={selectedProject} onBack={() => router.push("/my-portfolio")} type="swap" />
        ) : (
          <p>Loading...</p> // Optional: Add a loading state or placeholder
        )}
      </div>
    </>
  );
};

export default PoolDetailsPage;
