package com.benchmarking.rest.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.benchmarking.rest.domain.Category;
import com.benchmarking.rest.domain.Item;
import com.benchmarking.rest.dto.ItemRequest;
import com.benchmarking.rest.dto.ItemResponse;
import com.benchmarking.rest.exception.ResourceConflictException;
import com.benchmarking.rest.exception.ResourceNotFoundException;
import com.benchmarking.rest.mapper.ItemMapper;
import com.benchmarking.rest.repository.CategoryRepository;
import com.benchmarking.rest.repository.ItemRepository;

@Service
@Transactional
public class ItemService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final ItemMapper itemMapper;

    public ItemService(ItemRepository itemRepository,
                       CategoryRepository categoryRepository,
                       ItemMapper itemMapper) {
        this.itemRepository = itemRepository;
        this.categoryRepository = categoryRepository;
        this.itemMapper = itemMapper;
    }

    public Page<ItemResponse> list(Long categoryId, Pageable pageable) {
        if (categoryId == null) {
            return itemRepository.findAll(pageable).map(itemMapper::toResponse);
        }
        Category category = findCategory(categoryId);
        return itemRepository.findAllByCategory(category, pageable)
                .map(itemMapper::toResponse);
    }

    public ItemResponse get(Long id) {
        Item item = findItem(id);
        return itemMapper.toResponse(item);
    }

    public ItemResponse create(ItemRequest request) {
        String normalizedSku = request.getSku().trim();
        if (itemRepository.existsBySku(normalizedSku)) {
            throw new ResourceConflictException("Un article avec ce SKU existe déjà.");
        }
        Category category = findCategory(request.getCategoryId());
        Item item = new Item();
        itemMapper.updateEntity(request, item);
        item.setCategory(category);
        Item saved = itemRepository.save(item);
        return itemMapper.toResponse(saved);
    }

    public ItemResponse update(Long id, ItemRequest request) {
        Item item = findItem(id);
        String normalizedSku = request.getSku().trim();
        if (!item.getSku().equals(normalizedSku) && itemRepository.existsBySku(normalizedSku)) {
            throw new ResourceConflictException("Un article avec ce SKU existe déjà.");
        }
        Category category = findCategory(request.getCategoryId());
        itemMapper.updateEntity(request, item);
        item.setCategory(category);
        return itemMapper.toResponse(item);
    }

    public void delete(Long id) {
        Item item = findItem(id);
        itemRepository.delete(item);
    }

    private Item findItem(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article introuvable."));
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catégorie introuvable."));
    }
}

