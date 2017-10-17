package com.mobi.persistence.utils.api;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;

public interface BNodeService {

    /**
     * Skolemizes the provided BNode.
     *
     * @param bnode BNode to skolemize.
     * @return IRI which is a skolemized representation of the provided BNode.
     */
    IRI skolemize(BNode bnode);

    /**
     * Skolemizes the provided Value if it is a BNode.
     *
     * @param value Value to attempt to skolemize.
     * @return Value which is a skolemized representation of the provided Value if it is a BNode; otherwise, returns the
     *         provided Value.
     */
    Value skolemize(Value value);

    /**
     * Skolemizes any BNodes found in the provided Statement.
     *
     * @param statement Statement to search for BNodes to skolemize.
     * @return Statement which contains skolemized BNodes if that is required.
     */
    Statement skolemize(Statement statement);

    /**
     * Skolemizes all BNodes found in every Statement within the provided Model.
     *
     * @param model Model to search for BNodes to skolemize.
     * @return Model which contains the skolemized BNodes.
     */
    Model skolemize(Model model);

    /**
     * Deskolemizes the provided IRI.
     *
     * @param iri IRI to deskolemize.
     * @return BNode containing the deskolemized BNode.
     */
    BNode deskolemize(IRI iri);

    /**
     * Deskolemizes the provided value if it is a skolemized IRI.
     *
     * @param value Value to deskolemize.
     * @return Value which is the BNode if the Value is a skolemized IRI; otherwise, returns the provided Value.
     */
    Value deskolemize(Value value);

    /**
     * Deskolemizes the skolemized IRIs withing the provided Statement.
     *
     * @param statement Statement to search for skolemized IRIs.
     * @return Statement which contains the newly created BNodes.
     */
    Statement deskolemize(Statement statement);

    /**
     * Deskolemizes all skolemized IRIs found in every Statement within the provided Model.
     *
     * @param model Model to search for skolemized IRIs.
     * @return Model which contains the newly created BNodes.
     */
    Model deskolemize(Model model);
}
