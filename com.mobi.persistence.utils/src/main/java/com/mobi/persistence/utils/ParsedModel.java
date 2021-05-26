package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
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

import com.mobi.rdf.api.Model;
import org.eclipse.rdf4j.rio.RDFParseException;

import java.util.Objects;
import java.util.Optional;

/**
 * ParsedModel represents the results of parsing and building model.
 */
public class ParsedModel {
    private Model model;
    private String rdfFormatName;
    private Optional<RDFParseException> rdfParseException;

    public ParsedModel() {
        this.rdfParseException = Optional.empty();
    }

    /**
     * ParsedModel Constructor.
     * @param model Mobi Model
     * @param rdfFormatName format that was used to parse Mobi Model
     */
    public ParsedModel(Model model, String rdfFormatName) {
        this.model = model;
        this.rdfFormatName = rdfFormatName;
        this.rdfParseException = Optional.empty();
    }

    public Model getModel() {
        return model;
    }

    public void setModel(Model model) {
        this.model = model;
    }

    public String getRdfFormatName() {
        return rdfFormatName;
    }

    public void setRdfFormatName(String rdfFormatName) {
        this.rdfFormatName = rdfFormatName;
    }

    public Optional<RDFParseException> getRdfParseException() {
        return rdfParseException;
    }

    public void setRdfParseException(Optional<RDFParseException> rdfParseException) {
        this.rdfParseException = rdfParseException;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (other == null || getClass() != other.getClass()) {
            return false;
        }
        ParsedModel that = (ParsedModel) other;
        return Objects.equals(model, that.model) && Objects.equals(rdfFormatName, that.rdfFormatName)
                && Objects.equals(rdfParseException, that.rdfParseException);
    }

    @Override
    public int hashCode() {
        return Objects.hash(model, rdfFormatName, rdfParseException);
    }
}
