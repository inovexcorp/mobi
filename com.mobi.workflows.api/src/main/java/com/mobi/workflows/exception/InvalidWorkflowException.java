package com.mobi.workflows.exception;

/*-
 * #%L
 * com.mobi.workflows.api
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

import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Models;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;

import java.io.StringWriter;

public class InvalidWorkflowException extends MobiException {
    Model validationReport;

    public InvalidWorkflowException() {
        super();
    }

    public InvalidWorkflowException(String message) {
        super(message);
    }

    public InvalidWorkflowException(Throwable exception) {
        super(exception);
    }

    public InvalidWorkflowException(String message, Throwable exception) {
        super(message, exception);
    }

    public InvalidWorkflowException(String message, Throwable exception, Model validationReport) {
        super(message, exception);
        this.validationReport = validationReport;
    }

    @Override
    public String getMessage() {
        String message = super.getMessage();
        if (this.validationReport != null) {
            StringWriter sw = new StringWriter();
            Rio.write(this.validationReport, sw, RDFFormat.TURTLE);
            return message + Models.ERROR_OBJECT_DELIMITER + sw.toString().replaceAll("\n", Models.ERROR_OBJECT_DELIMITER);
        } else {
            return message;
        }
    }

    public Model getValidationReport() {
        return this.validationReport;
    }
}
