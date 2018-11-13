package com.mobi.rdf.orm;

/*-
 * #%L
 * RDF ORM
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.impl.ThingImpl;

import java.util.Optional;
import java.util.Set;

/**
 * A Thing is the base entity in an ontology. Every class will implement this
 * interface, to allow for some shared functionality and API.
 *
 * @author bdgould
 */
public interface Thing {

    /**
     * The type IRI string for a {@link Thing} instance.
     */
    String TYPE = "http://www.w3.org/2002/07/owl#Thing";

    /**
     * The default impl for this interface.
     */
    Class<? extends Thing> DEFAULT_IMPL = ThingImpl.class;

    /**
     * @return The {@link Resource} identifying this {@link Thing}
     */
    Resource getResource();

    /**
     * @return The backing {@link Model} for this {@link Thing}
     */
    Model getModel();

    /**
     * Get a {@link Value} from the given prediciate {@link IRI}.
     *
     * @param predicate The predicate identifying the property
     * @param context   The context {@link IRI}
     * @return The {@link Value} from the backing {@link Model} for this
     * {@link Thing}
     */
    Optional<Value> getProperty(IRI predicate, IRI... context);

    /**
     * Get a non-functional {@link Set} of {@link Value} objects from the
     * backing {@link Model}.
     *
     * @param predicate The {@link IRI} of the predicate you want values for
     * @param context   The {@link IRI} of the context of this statement
     * @return The {@link Set} of {@link Value}s with the specified prediciate
     * for this object
     */
    Set<Value> getProperties(IRI predicate, IRI... context);

    /**
     * Set a property in the backing model for this {@link Thing}. Removes other
     * statements with the same subject/predicate/context.
     *
     * @param value     The {@link Value} to store
     * @param predicate The predicate {@link IRI} of the property to set
     * @param context   The {@link IRI} of the context
     * @return Whether or not the property was set
     */
    boolean setProperty(Value value, IRI predicate, IRI... context);

    /**
     * Set the values of a non-functional property. Removes other statements
     * with the same subject/predicate/context.
     *
     * @param value     The {@link Set} of {@link Value}s to set the property to
     * @param predicate The prediciate {@link IRI} of the property to set
     * @param context   The context {@link IRI} to set the values for
     */
    void setProperties(Set<Value> value, IRI predicate, IRI... context);

    /**
     * Add a {@link Value} to a non-functional property for this Thing.
     *
     * @param value     The {@link Value} to add
     * @param predicate The predicate {@link IRI} to add it to
     * @param context   The context {@link IRI} to use
     * @return Whether or not the {@link Value} was added to
     */
    boolean addProperty(Value value, IRI predicate, IRI... context);

    /**
     * Remove the specified {@link Value} from the given non-functional property
     * for this {@link Thing}.
     *
     * @param value     The value to remove
     * @param predicate The predicate {@link IRI} to remove the {@link Value} from
     * @param context   The context {@link IRI} to use
     * @return Whether or not the {@link Value} was removed
     */
    boolean removeProperty(Value value, IRI predicate, IRI... context);

    /**
     * Clear out the values associated with the given predicate in this {@link Thing}.
     *
     * @param predicate The {@link IRI} of the predicate to clear out
     * @param context   The {@link IRI} contexts to remove with
     * @return Whether or not data was removed from this {@link Thing}
     */
    boolean clearProperty(IRI predicate, IRI... context);

    /**
     * @return The {@link ValueFactory} instance to use for this object
     */
    ValueFactory getValueFactory();

}
