package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;

import java.util.Optional;

public class Statements {

    /**
     * Retrieves an Object (Resource) from the statement.
     *
     * @param statement The statement to retrieve the resource
     * @return an object resource from the statement or an empty Optional.
     */
    public static Optional<Resource> objectResource(Statement statement) {
        Value object = statement.getObject();
        if (object instanceof Resource) {
            return Optional.of((Resource) object);
        } else {
            return Optional.empty();
        }
    }

    /**
     * Normalizes language tags in a Statement's object literal to lowercase. BCP 47 language tags are
     * case-insensitive, but RDF4J's NativeLiteral.equals() compares by internalID which is assigned from a
     * byte-level value lookup that is case-sensitive. This can cause HashMap lookups and repository operations to fail
     * when the same literal exists with different language tag casings (e.g., {@code @en-US} vs {@code @en-us}).
     * Normalizing to lowercase before comparison ensures consistent matching regardless of the original casing.
     *
     * @param statement The Statement to normalize
     * @param vf The ValueFactory to use for creating normalized literals and statements
     * @return A new Statement with the language tag lowercased, or the original Statement if no normalization
     *         was needed (no language tag, or language tag was already lowercase)
     */
    public static Statement normalizeLanguageTag(Statement statement, ValueFactory vf) {
        Value object = statement.getObject();
        if (object instanceof Literal lit) {
            Optional<String> lang = lit.getLanguage();
            if (lang.isPresent()) {
                String langTag = lang.get();
                String lower = langTag.toLowerCase();
                if (!langTag.equals(lower)) {
                    Literal normalized = vf.createLiteral(lit.getLabel(), lower);
                    return vf.createStatement(statement.getSubject(), statement.getPredicate(),
                            normalized, statement.getContext());
                }
            }
        }
        return statement;
    }
}
