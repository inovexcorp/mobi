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
import org.apache.commons.lang.StringUtils;
import org.eclipse.rdf4j.rio.RDFParseException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * ParsedModel represents the results of parsing and building model.
 */
public class ParsedModel {
    private Model model;
    private String rdfFormatName;
    private final Map<String, List<String>> formatToError = new HashMap<>();

    public ParsedModel() {}

    /**
     * ParsedModel Constructor.
     *
     * @param model Mobi Model
     * @param rdfFormatName format that was used to parse Mobi Model
     */
    public ParsedModel(Model model, String rdfFormatName) {
        this.model = model;
        this.rdfFormatName = rdfFormatName;
    }

    /**
     * Return the parsed model.
     *
     * @return the parsed model
     */
    public Model getModel() {
        return model;
    }

    /**
     * Set the Model on the ParsedModel.
     *
     * @param model The model to set as the underlying model
     */
    public void setModel(Model model) {
        this.model = model;
    }

    /**
     * Retrieve the RDFFormat string name.
     *
     * @return the RDFFormat string name
     */
    public String getRdfFormatName() {
        return rdfFormatName;
    }

    /**
     * Set the RDFFormat string name.
     *
     * @param rdfFormatName the RDFFormat string name to set
     */
    public void setRdfFormatName(String rdfFormatName) {
        this.rdfFormatName = rdfFormatName;
    }

    /**
     * Builds and returns an Optional of the RDFParseException if errors are present. Returns an empty optional if not.
     *
     * @return An Optional of the RDFParseException if errors are present; otherwise an empty optional.
     */
    public Optional<RDFParseException> getRdfParseException() {
        if (formatToError.size() > 0) {
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Error parsing formats: %s.", StringUtils.join(formatToError.keySet(), " ,")));
            for (String format : formatToError.keySet()) {
                sb.append(Models.ERROR_OBJECT_DELIMITER);
                sb.append(format);
                sb.append(": ");
                sb.append(StringUtils.join(formatToError.get(format), " ,"));
            }
            return Optional.of(new RDFParseException(sb.toString()));
        } else {
            return Optional.empty();
        }
    }

    /**
     * Adds the error string to the list of errors for the given format.
     *
     * @param format the RDFFormat for the error message
     * @param error the error message when parsed
     */
    public void addFormatToError(String format, String error) {
        List<String> errorMessages = formatToError.getOrDefault(format, new ArrayList<>());
        errorMessages.add(error);
        formatToError.put(format, errorMessages);
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
                && Objects.equals(formatToError, that.formatToError);
    }

    @Override
    public int hashCode() {
        return Objects.hash(model, rdfFormatName, formatToError);
    }
}
