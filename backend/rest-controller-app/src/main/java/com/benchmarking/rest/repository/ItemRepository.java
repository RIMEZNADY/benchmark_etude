package com.benchmarking.rest.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.benchmarking.rest.domain.Category;
import com.benchmarking.rest.domain.Item;

public interface ItemRepository extends JpaRepository<Item, Long> {

    Optional<Item> findBySku(String sku);

    boolean existsBySku(String sku);

    Page<Item> findAllByCategory(Category category, Pageable pageable);
}

