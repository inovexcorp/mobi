package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.RepositoryResult;

public class ConnectionUtils {
    /**
     * Indicates whether a statement with a specific subject, predicate, and/or object exists in the repository. The
     * result is optionally restricted to the specified set of named contexts. If the repository supports inferencing,
     * inferred statements will be included in the result.
     *
     * @param conn      - A RepositoryConnection to query.
     * @param subject   - A Resource specifying the subject, or null for a wildcard.
     * @param predicate - A URI specifying the predicate, or null for a wildcard.
     * @param object    - A Value specifying the object, or null for a wildcard.
     * @param contexts  - The context(s) to limit the query to. Note that this parameter is a vararg and as such is
     *                  optional. If no contexts are supplied the method operates on the entire repository.
     * @return True if a statement matching the specified pattern exists in the repository.
     * @throws RepositoryException when a problem occurs during retrieval.
     */
    public static boolean contains(RepositoryConnection conn, Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException {
        RepositoryResult<Statement> results = null;
        try {
            results = conn.getStatements(subject, predicate, object, contexts);
            return results.hasNext();
        } finally {
            if (results != null) {
                results.close();
            }
        }
    }

    /**
     * Indicates whether a specific context exists in the repository.
     *
     * @param conn    - A RepositoryConnection to query.
     * @param context - A Resource specifying the context.
     * @return True if the context exists in the repository.
     * @throws RepositoryException when a problem occurs during retrieval.
     */
    public static boolean containsContext(RepositoryConnection conn, Resource context) throws RepositoryException {
        return contains(conn, null, null, null, context);
    }
}
