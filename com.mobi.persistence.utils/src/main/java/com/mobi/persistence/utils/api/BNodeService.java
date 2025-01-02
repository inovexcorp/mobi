package com.mobi.persistence.utils.api;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;

import java.util.Map;

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
     * Skolemizes all BNodes found in every Statement within the provided Model using
     * deterministic and consistent BNode IDs. NOTE: This method:
     * <li>does not skolemize BNode named graph identifiers</li>
     * <li>does not skolemize BNode chains that do not begin with IRIs</li>
     *
     * @param model Model to search for BNodes to skolemize.
     * @return Model which contains the skolemized BNodes.
     */
    Model deterministicSkolemize(Model model);

    /**
     * Skolemizes all BNodes found in every Statement within the provided Model using
     * deterministic and consistent BNode IDs. NOTE: This method:
     * <li>does not skolemize BNode named graph identifiers</li>
     * <li>does not skolemize BNode chains that do not begin with IRIs</li>
     *
     * @param model Model to search for BNodes to skolemize.
     * @param skolemizedBNodes Map of BNodes to their corresponding deterministically skolemized IRI. Will be populated
     *                         when the method is run. Should provide an empty map to the method.
     * @return Model which contains the skolemized BNodes.
     */
    Model deterministicSkolemize(Model model, Map<BNode, IRI> skolemizedBNodes);

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
