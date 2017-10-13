package com.mobi.vfs.impl.commons;

/*-
 * #%L
 * com.mobi.vfs
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

import com.mobi.vfs.api.TemporaryVirtualFile;
import org.apache.commons.vfs2.FileObject;
import com.mobi.vfs.api.TemporaryVirtualFile;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.TemporalUnit;
import java.util.Date;

public class SimpleTemporaryVirtualFile extends SimpleVirtualFile implements TemporaryVirtualFile {

    private final long duration;

    private final TemporalUnit durationUnit;

    private final Date createDate;

    SimpleTemporaryVirtualFile(final FileObject fileObject, final long duration, final TemporalUnit durationUnit) {
        super(fileObject);
        this.duration = duration;
        this.durationUnit = durationUnit;
        this.createDate = new Date();
    }

    @Override
    public boolean isExpired() {
        // The create date.
        return Instant.ofEpochMilli(createDate.getTime())
                // Is before the time to live minus now.
                .isBefore(Instant.now().minus(Duration.of(duration, durationUnit)));
    }
}
