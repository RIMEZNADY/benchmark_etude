package com.benchmarking.rest.mapper;

import org.springframework.stereotype.Component;

import com.benchmarking.rest.domain.Category;
import com.benchmarking.rest.dto.CategoryRequest;
import com.benchmarking.rest.dto.CategoryResponse;

@Component
public class CategoryMapper {

    public void updateEntity(CategoryRequest request, Category category) {
        category.setCode(request.getCode().trim());
        category.setName(request.getName().trim());
    }

    public Category toEntity(CategoryRequest request) {
        Category category = new Category();
        updateEntity(request, category);
        return category;
    }

    public CategoryResponse toResponse(Category category) {
        CategoryResponse response = new CategoryResponse();
        response.setId(category.getId());
        response.setCode(category.getCode());
        response.setName(category.getName());
        response.setUpdatedAt(category.getUpdatedAt());
        return response;
    }
}

