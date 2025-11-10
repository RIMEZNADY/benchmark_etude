package com.benchmarking.rest.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.benchmarking.rest.domain.Category;
import com.benchmarking.rest.dto.CategoryRequest;
import com.benchmarking.rest.dto.CategoryResponse;
import com.benchmarking.rest.dto.ItemResponse;
import com.benchmarking.rest.exception.ResourceConflictException;
import com.benchmarking.rest.exception.ResourceNotFoundException;
import com.benchmarking.rest.mapper.CategoryMapper;
import com.benchmarking.rest.mapper.ItemMapper;
import com.benchmarking.rest.repository.CategoryRepository;
import com.benchmarking.rest.repository.ItemRepository;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;
    private final CategoryMapper categoryMapper;
    private final ItemMapper itemMapper;

    public CategoryService(CategoryRepository categoryRepository,
                           ItemRepository itemRepository,
                           CategoryMapper categoryMapper,
                           ItemMapper itemMapper) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.categoryMapper = categoryMapper;
        this.itemMapper = itemMapper;
    }

    public Page<CategoryResponse> list(Pageable pageable) {
        return categoryRepository.findAll(pageable)
                .map(categoryMapper::toResponse);
    }

    public CategoryResponse get(Long id) {
        Category category = findCategory(id);
        return categoryMapper.toResponse(category);
    }

    public CategoryResponse create(CategoryRequest request) {
        String normalizedCode = request.getCode().trim();
        if (categoryRepository.existsByCode(normalizedCode)) {
            throw new ResourceConflictException("Une catégorie avec ce code existe déjà.");
        }
        Category category = categoryMapper.toEntity(request);
        Category saved = categoryRepository.save(category);
        return categoryMapper.toResponse(saved);
    }

    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = findCategory(id);
        String normalizedCode = request.getCode().trim();
        if (!category.getCode().equals(normalizedCode) && categoryRepository.existsByCode(normalizedCode)) {
            throw new ResourceConflictException("Une catégorie avec ce code existe déjà.");
        }
        categoryMapper.updateEntity(request, category);
        return categoryMapper.toResponse(category);
    }

    public void delete(Long id) {
        Category category = findCategory(id);
        categoryRepository.delete(category);
    }

    public Page<ItemResponse> listItems(Long categoryId, Pageable pageable) {
        Category category = findCategory(categoryId);
        return itemRepository.findAllByCategory(category, pageable)
                .map(itemMapper::toResponse);
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable."));
    }
}

