package com.benchmarking.rest.resource;

import com.benchmarking.rest.dto.ItemRequest;
import com.benchmarking.rest.dto.ItemResponse;
import com.benchmarking.rest.service.ItemService;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

@Component
@Path("/items")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ItemResource {

    private final ItemService itemService;

    public ItemResource(ItemService itemService) {
        this.itemService = itemService;
    }

    @GET
    public Page<ItemResponse> list(@QueryParam("categoryId") Long categoryId,
                                   @QueryParam("page") @DefaultValue("0") int page,
                                   @QueryParam("size") @DefaultValue("20") int size) {
        return itemService.list(categoryId, PageRequest.of(page, size));
    }

    @GET
    @Path("/{id}")
    public ItemResponse get(@PathParam("id") Long id) {
        return itemService.get(id);
    }

    @POST
    public Response create(@Valid ItemRequest request, @Context UriInfo uriInfo) {
        ItemResponse created = itemService.create(request);
        return Response.created(
                uriInfo.getAbsolutePathBuilder().path(created.getId().toString()).build()
        ).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public ItemResponse update(@PathParam("id") Long id, @Valid ItemRequest request) {
        return itemService.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        itemService.delete(id);
        return Response.noContent().build();
    }
}

