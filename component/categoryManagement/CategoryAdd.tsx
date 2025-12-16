"use client";
import { createCategory, Category } from "@/app/actions/category";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import CategoryForm, { CategoryFormData } from "./CategoryForm";

interface CategoryAddProps {
  categoriesList: Category[];
}

const CategoryAdd = ({ categoriesList }: CategoryAddProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    
    try {
        const response = await createCategory(data);

        if (response.success) {
            toast.success("Category created successfully!");
            router.push("/categories");
            router.refresh();
        } else {
            toast.error(response.error || "Failed to create category");
        }
    } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <CategoryForm
      title="Add New Category"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      categoriesList={categoriesList}
    />
  );
};

export default CategoryAdd;