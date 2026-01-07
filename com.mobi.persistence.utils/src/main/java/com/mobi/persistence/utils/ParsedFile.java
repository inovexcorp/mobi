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

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.apache.commons.lang.StringUtils;
import org.eclipse.rdf4j.rio.RDFParseException;

public class ParsedFile {
    private Optional<File> file;
    private final Map<String, List<String>> formatToError = new HashMap<>();

    public ParsedFile() {
        file = Optional.empty();
    }

    public Optional<File> getFile() {
        return file;
    }

    public void setFile(File file) {
        this.file = Optional.of(file);
    }

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
}
